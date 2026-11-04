'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { tshirtSizeLabels } from '@/components/app-ui/app-tshirt-size';
import { Button } from '@/components/base-ui/button';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/base-ui/select';
import { Switch } from '@/components/base-ui/switch';
import { Textarea } from '@/components/base-ui/textarea';
import { toast } from '@/components/base-ui/toast';
import { tshirtSizesEnum } from '@/db/schema';
import { createSignUpAction } from '@/lib/actions/signUp';
import { buildSignupFormSchema } from '@/lib/schemas/signup-form';

type TShirtSize = (typeof tshirtSizesEnum.enumValues)[number];

export function BrowseOpportunitySignupForm({
  opportunityId,
  mealProvided,
  tshirtProvided,
  mealOptions,
  defaultHours,
}: {
  opportunityId: string;
  mealProvided: boolean;
  tshirtProvided: boolean;
  mealOptions: { id: string; mealName: string }[];
  defaultHours: number;
}) {
  const [isSubmitting, startSubmitting] = useTransition();

  const signupFormSchema = useMemo(
    () =>
      buildSignupFormSchema({
        mealProvided,
        tshirtProvided,
        mealOptionIds: mealOptions.map((m) => m.id),
      }),
    [mealProvided, tshirtProvided, mealOptions],
  );

  const form = useForm<
    z.input<typeof signupFormSchema>,
    unknown,
    z.output<typeof signupFormSchema>
  >({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      estimatedHours: String(defaultHours),
      wantsMeal: false,
      selectedMeal: null,
      wantsTShirt: false,
      tshirtSize: null,
      comments: '',
    },
  });

  const wantsMeal = form.watch('wantsMeal');
  const wantsTShirt = form.watch('wantsTShirt');

  function onSubmit() {
    startSubmitting(async () => {
      try {
        const result = await createSignUpAction(
          opportunityId,
          form.getValues(),
        );

        if (!result.success) {
          toast.add({
            type: 'error',
            title: 'Could not sign up',
            description: result.message,
          });
          return;
        }

        toast.add({ type: 'success', title: "You're signed up!" });
      } catch {
        toast.add({
          type: 'error',
          title: 'Could not sign up',
          description: 'Something went wrong. Please try again.',
        });
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border p-4"
    >
      <h3 className="font-semibold">Sign up</h3>

      <Field>
        <FieldLabel htmlFor="estimatedHours">Estimated hours</FieldLabel>
        <Input
          id="estimatedHours"
          type="number"
          min={0.5}
          max={24}
          step="0.5"
          {...form.register('estimatedHours')}
          aria-invalid={!!form.formState.errors.estimatedHours}
        />
        <FieldDescription>How long you expect to volunteer</FieldDescription>
        <FieldError errors={[form.formState.errors.estimatedHours]} />
      </Field>
      {mealProvided && (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="wantsMeal">I'd like a meal</FieldLabel>
          </FieldContent>
          <Controller
            control={form.control}
            name="wantsMeal"
            render={({ field }) => (
              <Switch
                id="wantsMeal"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </Field>
      )}

      {mealProvided && wantsMeal && mealOptions.length > 0 && (
        <Field>
          <FieldLabel htmlFor="selectedMeal">Meal choice</FieldLabel>
          <Controller
            control={form.control}
            name="selectedMeal"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="selectedMeal"
                  className="w-full"
                  aria-invalid={!!form.formState.errors.selectedMeal}
                >
                  <SelectValue>
                    {(value: string | null) =>
                      mealOptions.find((m) => m.id === value)?.mealName ??
                      'Select a meal...'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Select a meal...</SelectItem>
                  {mealOptions.map((meal) => (
                    <SelectItem key={meal.id} value={meal.id}>
                      {meal.mealName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[form.formState.errors.selectedMeal]} />
        </Field>
      )}

      {tshirtProvided && (
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="wantsTShirt">I'd like a t-shirt</FieldLabel>
          </FieldContent>
          <Controller
            control={form.control}
            name="wantsTShirt"
            render={({ field }) => (
              <Switch
                id="wantsTShirt"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </Field>
      )}

      {tshirtProvided && wantsTShirt && (
        <Field>
          <FieldLabel htmlFor="tshirtSize">T-shirt size</FieldLabel>
          <Controller
            control={form.control}
            name="tshirtSize"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="tshirtSize"
                  className="w-full"
                  aria-invalid={!!form.formState.errors.tshirtSize}
                >
                  <SelectValue>
                    {(value: TShirtSize | null) =>
                      value === null
                        ? 'Select a size...'
                        : tshirtSizeLabels[value]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Select a size...</SelectItem>
                  {tshirtSizesEnum.enumValues.map((size) => (
                    <SelectItem key={size} value={size}>
                      {tshirtSizeLabels[size]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[form.formState.errors.tshirtSize]} />
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="comments">Comments (optional)</FieldLabel>
        <Textarea
          id="comments"
          rows={3}
          {...form.register('comments')}
          aria-invalid={!!form.formState.errors.comments}
        />
        <FieldError errors={[form.formState.errors.comments]} />
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing up...' : 'Sign up'}
      </Button>
    </form>
  );
}
