import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_DOC_SIZE_MB = 10;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Duhet të jeni të kyçur' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Skedari mungon' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Lejohen vetëm PDF ose imazhe (JPG, PNG, WebP)' },
      { status: 400 }
    );
  }

  if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Madhësia maksimale është ${MAX_DOC_SIZE_MB}MB` },
      { status: 400 }
    );
  }

  const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const fileName = `${user.id}/${Date.now()}-certificate.${ext}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await admin.storage
    .from('business-documents')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage
    .from('business-documents')
    .getPublicUrl(data.path);

  return NextResponse.json({ path: data.path, url: urlData.publicUrl });
}
