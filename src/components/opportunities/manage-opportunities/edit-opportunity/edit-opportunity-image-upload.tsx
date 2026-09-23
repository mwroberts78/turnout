import { upload } from '@vercel/blob/client';
import Image from 'next/image';
import { type ChangeEvent, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { z } from 'zod';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { Button } from '@/components/base-ui/button';
import { Input } from '@/components/base-ui/input';
import type { OpportunityFormSchema } from '@/lib/schemas/opportunity-form';

export function EditOpportunityImageUpload() {
  const form = useFormContext<z.input<OpportunityFormSchema>>();
  const imageUrl = form.watch('imageUrl');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const blob = await upload(`opportunities/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/opportunity-image',
      });
      form.setValue('imageUrl', blob.url, { shouldDirty: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }

  return (
    <AppInfoCard title="Image">
      <div className="space-y-3">
        {imageUrl && (
          <div className="relative aspect-video overflow-hidden rounded-md">
            <Image
              src={imageUrl}
              alt="Opportunity image"
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover"
            />
          </div>
        )}
        <Input
          type="file"
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {isUploading && (
          <p className="text-sm text-muted-foreground">Uploading...</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {imageUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              form.setValue('imageUrl', null, { shouldDirty: true })
            }
          >
            Remove image
          </Button>
        )}
      </div>
    </AppInfoCard>
  );
}
