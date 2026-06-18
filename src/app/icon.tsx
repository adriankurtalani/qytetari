import { ImageResponse } from 'next/og';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon() {
  const settings = await getSiteSettings();

  if (settings.favicon_url) {
    return new ImageResponse(
      (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.favicon_url}
          alt=""
          width={32}
          height={32}
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
          fontSize: 20,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 6,
        }}
      >
        {letter}
      </div>
    ),
    { ...size }
  );
}
