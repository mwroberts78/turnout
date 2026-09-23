import { type HandleUploadBody, handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth';
import { isAdminUser } from '@/lib/types/appUser';

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const appUser = await getCurrentAppUser();
        if (appUser.status !== 'active' || !isAdminUser(appUser)) {
          throw new Error('Not authorized');
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
