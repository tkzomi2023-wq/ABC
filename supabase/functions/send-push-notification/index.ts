import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { user_id, title, body, click_action, icon } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!serviceRoleKey || !supabaseUrl) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service-role client to bypass RLS on push_subscriptions
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all FCM tokens for this user (multiple devices)
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("fcm_token")
      .eq("user_id", user_id);

    if (subError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: false, reason: "no_subscriptions", token_count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Firebase project ID — from env or hard-coded fallback
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID") || "aizawlbiblecollege";

    // Get OAuth2 access token for Firebase Cloud Messaging API (v1)
    // Uses the service account JSON if provided via secret
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");

    let accessToken: string | null = null;

    if (serviceAccountJson) {
      // Parse the service account and generate a JWT-based OAuth2 token
      const creds = JSON.parse(serviceAccountJson);
      accessToken = await getFirebaseAccessToken(creds);
    } else {
      return new Response(
        JSON.stringify({
          error: "FIREBASE_SERVICE_ACCOUNT_JSON secret is not configured. Add it in Supabase Edge Function secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    // Data-only payload: no "notification" field so FCM does NOT auto-display.
    // The service worker's onBackgroundMessage handles the single display.
    // Sending both notification + data causes two notifications (FCM auto-display + SW display).
    const notificationPayload = {
      data: {
        title,
        body,
        click_action: click_action || "/",
        icon: icon || "/logo.png",
        tag: "abc-notification",
      },
    };

    let successCount = 0;
    let failureCount = 0;
    const staleTokens: string[] = [];

    // Send to each token individually (FCM v1 API)
    for (const sub of subscriptions) {
      const message = {
        ...notificationPayload,
        token: sub.fcm_token,
      };

      const response = await fetch(fcmEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        successCount++;
      } else {
        const errBody = await response.text();
        // UNREGISTERED = stale token, should remove it
        if (errBody.includes("UNREGISTERED") || errBody.includes("invalid-registration")) {
          staleTokens.push(sub.fcm_token);
        }
        failureCount++;
      }
    }

    // Clean up stale tokens
    if (staleTokens.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("fcm_token", staleTokens);
    }

    return new Response(
      JSON.stringify({
        sent: true,
        token_count: subscriptions.length,
        success_count: successCount,
        failure_count: failureCount,
        stale_removed: staleTokens.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Generates an OAuth2 access token for the Firebase Cloud Messaging API
 * using the service account credentials (JWT signing).
 */
async function getFirebaseAccessToken(creds: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Create JWT
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const privateKey = await importPrivateKey(creds.private_key);

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(data)
  );

  const encodedSignature = base64url(signature);
  const jwt = `${data}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function base64url(input: string | ArrayBuffer): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = new Uint8Array(input);
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  // Remove PEM headers and convert to binary
  const pemContents = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}
