'use client';

import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import type { z } from 'zod';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import {
  type OpportunityType,
  typeLabels,
} from '@/components/app-ui/app-opportunity-type';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/base-ui/field';
import { Input } from '@/components/base-ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/base-ui/select';
import { Switch } from '@/components/base-ui/switch';
import { opportunityTypeEnum } from '@/db/schema';
import { getTimeZoneLabel, US_TIME_ZONES } from '@/lib/constants/usTimeZones';
import type { OpportunityFormSchema } from '@/lib/schemas/opportunity-form';

const oppTypeSelectItems = opportunityTypeEnum.enumValues.map((type) => {
  return { label: typeLabels[type], value: type };
});

export function EditOpportunityDetailsFields({
  mealSignupCount,
  tshirtSignupCount,
}: {
  mealSignupCount: number;
  tshirtSignupCount: number;
}) {
  const form = useFormContext<z.input<OpportunityFormSchema>>();

  const opportunityType = form.watch('opportunityType');
  const hasPhysicalLocation = form.watch('hasPhysicalLocation');

  useEffect(() => {
    if (opportunityType === 'virtual') {
      form.setValue('hasPhysicalLocation', false);
      form.setValue('timeZone', null);
    }
  }, [opportunityType, form]);

  const showTimeZone =
    opportunityType === 'in-person' ||
    (opportunityType === 'skills-based' && hasPhysicalLocation);

  return (
    <AppInfoCard title="Details">
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="opportunityType">Opportunity type</FieldLabel>
          <Controller
            control={form.control}
            name="opportunityType"
            render={({ field }) => (
              <Select
                value={field.value ?? null}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  className="w-full max-w-64"
                  id="opportunityType"
                  aria-invalid={!!form.formState.errors.opportunityType}
                >
                  <SelectValue>
                    {(value: OpportunityType | null) =>
                      value === null ? (
                        'Select type...'
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${value}-dot`}
                          />
                          {typeLabels[value as keyof typeof typeLabels]}
                        </span>
                      )
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Opportunity type</SelectLabel>
                    <SelectItem value={null}>Select type...</SelectItem>
                    {oppTypeSelectItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        <span
                          className={`mt-1.5 size-2 rounded-full ${item.value}-dot`}
                        ></span>{' '}
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />

          <FieldDescription>Select the opportunity's type</FieldDescription>
          <FieldError errors={[form.formState.errors.opportunityType]} />
        </Field>

        {opportunityType !== 'virtual' && (
          <Field>
            <FieldLabel htmlFor="location">Opportunity location</FieldLabel>
            <Input
              id="location"
              type="text"
              placeholder="Opportunity location"
              {...form.register('location')}
              aria-invalid={!!form.formState.errors.location}
            />
            <FieldError errors={[form.formState.errors.location]} />
          </Field>
        )}

        {opportunityType === 'skills-based' && (
          <Field orientation="horizontal" className="max-w-sm">
            <FieldContent>
              <FieldLabel htmlFor="hasPhysicalLocation">
                Physical location
              </FieldLabel>
              <FieldDescription>
                Select if the opportunity will be at a physical location
              </FieldDescription>
            </FieldContent>
            <Controller
              control={form.control}
              name="hasPhysicalLocation"
              render={({ field }) => (
                <Switch
                  id="hasPhysicalLocation"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </Field>
        )}

        <div className="grid gap-x-4 @min-[420px]:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="startTime">Start time</FieldLabel>
            <Input
              {...form.register('startTime')}
              aria-invalid={!!form.formState.errors.startTime}
              type="datetime-local"
              id="startTime"
            />
            <FieldError errors={[form.formState.errors.startTime]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="endTime">End time</FieldLabel>
            <Input
              type="datetime-local"
              id="endTime"
              {...form.register('endTime')}
              aria-invalid={!!form.formState.errors.endTime}
            />
            <FieldError errors={[form.formState.errors.endTime]} />
          </Field>
        </div>

        {showTimeZone && (
          <Field>
            <FieldLabel htmlFor="timeZone">Time zone</FieldLabel>
            <Controller
              control={form.control}
              name="timeZone"
              render={({ field }) => (
                <Select
                  value={field.value ?? null}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    className="w-full max-w-64"
                    id="timeZone"
                    aria-invalid={!!form.formState.errors.timeZone}
                  >
                    <SelectValue>
                      {(value: string | null) =>
                        value === null
                          ? 'Select time zone...'
                          : getTimeZoneLabel(value)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Time zone</SelectLabel>
                      <SelectItem value={null}>Select time zone...</SelectItem>
                      {US_TIME_ZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />

            <FieldDescription>
              Select the opportunity's time zone
            </FieldDescription>
            <FieldError errors={[form.formState.errors.timeZone]} />
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="maxSignupsAllowed">
            Opportunity capacity
          </FieldLabel>
          <Input
            id="maxSignupsAllowed"
            type="number"
            min={1}
            placeholder="Unlimited"
            {...form.register('maxSignupsAllowed')}
            aria-invalid={!!form.formState.errors.maxSignupsAllowed}
          />
          <FieldDescription>
            Leave blank for unlimited capacity
          </FieldDescription>
          <FieldError errors={[form.formState.errors.maxSignupsAllowed]} />
        </Field>

        <Field orientation="horizontal" className="max-w-sm">
          <FieldContent>
            <FieldLabel htmlFor="tshirtProvided">T-Shirt provided</FieldLabel>
            <FieldDescription>
              {tshirtSignupCount > 0
                ? `${tshirtSignupCount} signup${tshirtSignupCount === 1 ? '' : 's'} chose a t-shirt, so this can't be turned off`
                : 'Will a t-shirt be provided for this opportunity?'}
            </FieldDescription>
          </FieldContent>
          <Controller
            control={form.control}
            name="tshirtProvided"
            render={({ field }) => (
              <Switch
                id="tshirtProvided"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={tshirtSignupCount > 0 && field.value}
              />
            )}
          />
        </Field>

        <Field orientation="horizontal" className="max-w-sm">
          <FieldContent>
            <FieldLabel htmlFor="mealProvided">Meal provided</FieldLabel>
            <FieldDescription>
              {mealSignupCount > 0
                ? `${mealSignupCount} signup${mealSignupCount === 1 ? '' : 's'} chose a meal, so this can't be turned off`
                : 'Will a meal be provided for this opportunity?'}
            </FieldDescription>
          </FieldContent>
          <Controller
            control={form.control}
            name="mealProvided"
            render={({ field }) => (
              <Switch
                id="mealProvided"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={mealSignupCount > 0 && field.value}
              />
            )}
          />
        </Field>
      </div>
    </AppInfoCard>
  );
}
