import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const BASE_URL = "https://aizawlbiblecollege.in";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function imageEntry(url: string, title: string, caption: string, lastmod: string): string {
  if (!url) return "";
  return `
    <image:image>
      <image:loc>${escapeXml(url)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
      <image:caption>${escapeXml(caption)}</image:caption>
      ${lastmod ? `<image:lastmod>${lastmod}</image:lastmod>` : ""}
    </image:image>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [blogPosts, photos, teachers, boardMembers, notices] = await Promise.all([
      supabase.from("blog_posts").select("slug, featured_image_url, supporting_image_url, second_image_url, title, updated_at").eq("is_published", true),
      supabase.from("photos").select("image_url, title, created_at"),
      supabase.from("teachers").select("photo_url, full_name"),
      supabase.from("board_members").select("photo_url, name"),
      supabase.from("notices").select("image_url, title, created_at").not("image_url", "is", null),
    ]);

    let images = "";

    for (const post of blogPosts.data ?? []) {
      images += imageEntry(post.featured_image_url, post.title, `Featured image for ${post.title}`, post.updated_at);
      images += imageEntry(post.supporting_image_url, post.title, `Supporting image for ${post.title}`, post.updated_at);
      images += imageEntry(post.second_image_url, post.title, `Second image for ${post.title}`, post.updated_at);
    }

    for (const photo of photos.data ?? []) {
      images += imageEntry(photo.image_url, photo.title ?? "Gallery photo", photo.title ?? "", photo.created_at);
    }

    for (const t of teachers.data ?? []) {
      images += imageEntry(t.photo_url, t.full_name, `Photo of ${t.full_name}`, "");
    }

    for (const b of boardMembers.data ?? []) {
      images += imageEntry(b.photo_url, b.name, `Photo of ${b.name}`, "");
    }

    for (const n of notices.data ?? []) {
      images += imageEntry(n.image_url, n.title, `Image for notice: ${n.title}`, n.created_at);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>${images}
  </url>
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/xml" } },
    );
  }
});
