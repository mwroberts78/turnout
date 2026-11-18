'use client';

import { toast } from '@/components/base-ui/toast';
import { SignupForm } from '@/components/signups/signup-form';
import { createSignUpAction } from '@/lib/actions/signUp';

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
  return (
    <SignupForm
      mealProvided={mealProvided}
      tshirtProvided={tshirtProvided}
      mealOptions={mealOptions}
      defaultValues={{
        estimatedHours: String(defaultHours),
        wantsMeal: false,
        selectedMeal: null,
        wantsTShirt: false,
        tshirtSize: null,
        comments: '',
      }}
      submitLabel="Sign up"
      pendingLabel="Signing up..."
      className="space-y-4 rounded-lg border p-4"
      onSubmit={async (values) => {
        try {
          const result = await createSignUpAction(opportunityId, values);

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
      }}
    >
      <h3 className="font-semibold">Sign up</h3>
    </SignupForm>
  );
}
