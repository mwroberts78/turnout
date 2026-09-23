'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMemo, useTransition } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { Button } from '@/components/base-ui/button';
import { toast } from '@/components/base-ui/toast';
import { saveOpportunityAction } from '@/lib/actions/opportunity';
import type { OpportunityWithDetails } from '@/lib/dal/opportunity';
import { buildOpportunityFormSchema } from '@/lib/schemas/opportunity-form';
import { cn } from '@/lib/utils';
import { toDatetimeLocalValue } from '@/lib/utils/toDatetimeLocalValue';
import { EditOpportunityDetailsFields } from './edit-opportunity-details-fields';
import { EditOpportunityImageUpload } from './edit-opportunity-image-upload';
import { EditOpportunityMealOptions } from './edit-opportunity-meal-options';
import { EditOpportunityOverviewFields } from './edit-opportunity-overview-fields';

export function EditOpportunityForm({
  opportunity,
}: {
  opportunity?: OpportunityWithDetails;
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const minCapacity = opportunity?.signUps.length ?? 0;
  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const opportunityFormSchema = useMemo(
    () => buildOpportunityFormSchema(minCapacity, browserTimeZone),
    [minCapacity, browserTimeZone],
  );

  const form = useForm<
    z.input<typeof opportunityFormSchema>,
    unknown,
    z.output<typeof opportunityFormSchema>
  >({
    resolver: zodResolver(opportunityFormSchema),
    values: opportunity
      ? {
          title: opportunity.title,
          description: opportunity.description,
          opportunityType: opportunity.opportunityType,
          location: opportunity.location,
          startTime: toDatetimeLocalValue(
            opportunity.startTime,
            opportunity.timeZone ?? browserTimeZone,
          ),
          endTime: toDatetimeLocalValue(
            opportunity.endTime,
            opportunity.timeZone ?? browserTimeZone,
          ),
          timeZone: opportunity.timeZone,
          hasPhysicalLocation: opportunity.timeZone !== null,
          maxSignupsAllowed:
            opportunity.maxSignupsAllowed === null
              ? ''
              : String(opportunity.maxSignupsAllowed),
          tshirtProvided: opportunity.tshirtProvided,
          mealProvided: opportunity.mealProvided,
          mealOptions: opportunity.mealOptions.map((m) => ({
            mealOptionId: m.id,
            mealName: m.mealName,
          })),
          imageUrl: opportunity.imageUrl,
        }
      : undefined,
    defaultValues: {
      title: '',
      description: '',
      opportunityType: undefined,
      location: '',
      startTime: '',
      endTime: '',
      timeZone: null,
      imageUrl: null,
      hasPhysicalLocation: false,
      maxSignupsAllowed: '',
      tshirtProvided: false,
      mealProvided: false,
      mealOptions: [],
    },
  });

  function onSubmit() {
    startSaving(async () => {
      try {
        const result = await saveOpportunityAction(
          opportunity?.id ?? null,
          form.getValues(),
          browserTimeZone,
        );

        if (!result.success) {
          toast.add({
            type: 'error',
            title: 'Could not save opportunity',
            description: result.message,
          });
          return;
        }

        toast.add({
          type: 'success',
          title: opportunity ? 'Opportunity saved' : 'Opportunity created',
        });
        router.push(`/opportunities/manage/${result.id}`);
      } catch {
        toast.add({
          type: 'error',
          title: 'Could not save opportunity',
          description: 'Something went wrong. Please try again.',
        });
      }
    });
  }

  const showMeals = form.watch('mealProvided');
  const submitLabel = opportunity ? 'Save changes' : 'Create opportunity';

  const mealSignupCount =
    opportunity?.signUps.filter((s) => s.wantsMeal).length ?? 0;
  const tshirtSignupCount =
    opportunity?.signUps.filter((s) => s.wantsTShirt).length ?? 0;

  const mealOptionUsage: Record<string, number> = {};
  for (const s of opportunity?.signUps ?? []) {
    if (s.selectedMeal) {
      mealOptionUsage[s.selectedMeal] =
        (mealOptionUsage[s.selectedMeal] ?? 0) + 1;
    }
  }

  return (
    <>
      {opportunity && (
        <AppBreadcrumb
          overrides={{ '/opportunities/manage/[id]': opportunity.title }}
        />
      )}
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mb-4 flex flex-col justify-between space-y-4 @min-[1100px]:flex-row @min-[1100px]:items-center @min-[1100px]:space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                {opportunity ? 'Edit' : 'New'} Opportunity
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => form.reset()}
                disabled={isSaving}
              >
                {opportunity ? 'Discard changes' : 'Clear'}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : submitLabel}
              </Button>
            </div>
          </div>
          <div
            className={cn(
              'grid gap-4 @min-[1100px]:grid-cols-6',
              isSaving && 'opacity-60',
            )}
            inert={isSaving}
            aria-busy={isSaving}
          >
            <div className="space-y-4 @min-[1100px]:col-span-3">
              <EditOpportunityOverviewFields />
              <EditOpportunityImageUpload />
            </div>
            <div className="@container space-y-4 @min-[1100px]:col-span-3">
              <EditOpportunityDetailsFields
                mealSignupCount={mealSignupCount}
                tshirtSignupCount={tshirtSignupCount}
              />
              {showMeals && (
                <EditOpportunityMealOptions usageByOptionId={mealOptionUsage} />
              )}
            </div>
          </div>
        </form>
      </FormProvider>
    </>
  );
}
