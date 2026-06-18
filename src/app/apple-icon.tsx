import { ImageResponse } from 'next/og';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const settings = await getSiteSettings();

  if (settings.favicon_url) {
    return new ImageResponse(
      (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.favicon_url}
          alt=""
          width={180}
          height={180}
          style={{ objectFit: 'contain', width: '100%', height: '100%' }}
        />
      ),
      { ...size }
    );
  }

  const letter = (settings.logo_abbr || settings.platform_name?.[0] || 'Z').toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 32,
        }}
      >
        {letter}
      </div>
    ),
    { ...size }
  );
}
