'use client';

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
  opportunityType: keyof typeof typeLabels;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return <AppOpportunityTypeBlock oppType={opportunityType} />;
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
