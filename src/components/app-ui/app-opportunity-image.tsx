'use client';

import { ImageOff } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { typeLabels } from './app-opportunity-type';
import { AppOpportunityTypeBlock } from './app-opportunity-type-block';

export function AppOpportunityImage({
  imageUrl,
  opportunityType,
  alt,
  sizes,
  className,
}: {
  imageUrl: string | null;
  opportunityType: keyof typeof typeLabels | undefined;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    if (opportunityType) {
      return <AppOpportunityTypeBlock oppType={opportunityType} />;
    }

    return (
      <div className="flex h-full w-full items-center justify-center">
        <ImageOff className="size-16 text-muted-foreground opacity-50" />
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
