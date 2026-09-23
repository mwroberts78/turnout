'use client';

import { useFormContext } from 'react-hook-form';
import type { z } from 'zod';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { Field, FieldError, FieldLabel } from '@/components/base-ui/field';
import { Input } from '@/components/base-ui/input';
import { Textarea } from '@/components/base-ui/textarea';
import type { OpportunityFormSchema } from '@/lib/schemas/opportunity-form';

export function EditOpportunityOverviewFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<z.input<OpportunityFormSchema>>();

  return (
    <AppInfoCard title="Overview">
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="title">Opportunity title</FieldLabel>
          <Input
            id="title"
            type="text"
            placeholder="Opportunity title"
            {...register('title')}
            aria-invalid={!!errors.title}
          />
          <FieldError errors={[errors.title]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Opportunity description</FieldLabel>
          <Textarea
            id="description"
            placeholder="Opportunity description"
            {...register('description')}
          />
        </Field>
      </div>
    </AppInfoCard>
  );
}
