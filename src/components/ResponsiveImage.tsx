import { useState } from 'react';

type Props = {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  widths?: number[];
  sizes?: string;
  /** Aspect ratio in "W/H" form (e.g. "16/9") — sets aspect-ratio CSS to prevent CLS */
  aspectRatio?: string;
  /** Fallback image if the src fails to load */
  fallbackSrc?: string;
  style?: React.CSSProperties;
};

const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0IDMiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjMiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4=';

function buildSrcset(src: string, widths: number[]): string {
  const isPexels = src.includes('pexels.com');
  const hasQuery = src.includes('?');

  if (isPexels) {
    const clean = src.replace(/&w=\d+/, '');
    return widths.map((w) => `${clean}&w=${w} ${w}w`).join(', ');
  }

  const separator = hasQuery ? '&' : '?';
  return widths.map((w) => `${src}${separator}width=${w} ${w}w`).join(', ');
}

export default function ResponsiveImage({
  src,
  alt,
  className,
  loading = 'lazy',
  widths = [400, 800, 1200, 1600],
  sizes = '100vw',
  aspectRatio,
  fallbackSrc,
  style: styleProp,
}: Props) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasErrored, setHasErrored] = useState(false);

  const supportsResize =
    src.includes('pexels.com') ||
    src.includes('supabase.co/storage') ||
    src.includes('supabase.in/storage');

  const style: React.CSSProperties = { ...styleProp };
  if (aspectRatio) style.aspectRatio = aspectRatio;

  return (
    <img
      src={currentSrc}
      srcSet={supportsResize ? buildSrcset(currentSrc, widths) : undefined}
      sizes={supportsResize ? sizes : undefined}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      style={style}
      onError={() => {
        if (!hasErrored) {
          setHasErrored(true);
          if (fallbackSrc) {
            setCurrentSrc(fallbackSrc);
          } else {
            setCurrentSrc(PLACEHOLDER_SVG);
          }
        }
      }}
    />
  );
}
