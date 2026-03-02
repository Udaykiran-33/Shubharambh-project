import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Increase body size limit to 10MB to handle large base64 images
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, folder } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    if (!image.startsWith('data:image')) {
      return NextResponse.json({ error: 'Invalid image format. Must be a base64 data URL.' }, { status: 400 });
    }

    const uploadFolder = folder || 'shubharambh';
    const url = await uploadToCloudinary(image, uploadFolder);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('[API/upload] Cloudinary upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
