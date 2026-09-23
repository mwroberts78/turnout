import { del } from '@vercel/blob';

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';

export async function deleteBlobImage(url: string | null) {
  if (!url) return;
  try {
    if (!new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX)) return;
    await del(url);
  } catch (error) {
    console.error('Failed to delete blob', url, error);
  }
}
