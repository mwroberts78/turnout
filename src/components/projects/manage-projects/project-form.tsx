'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { Button } from '@/components/base-ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/base-ui/field';
import { Input } from '@/components/base-ui/input';
import { Textarea } from '@/components/base-ui/textarea';
import { toast } from '@/components/base-ui/toast';
import { saveProjectAction } from '@/lib/actions/project';
import {
  type ProjectFormInput,
  type ProjectFormOutput,
  projectFormSchema,
} from '@/lib/schemas/project-form';

export function ProjectForm({
  project,
}: {
  project?: { id: string; title: string; description: string | null };
}) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const form = useForm<ProjectFormInput, unknown, ProjectFormOutput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: project?.title ?? '',
      description: project?.description ?? '',
    },
  });

  function onSubmit() {
    startSaving(async () => {
      try {
        const result = await saveProjectAction(
          project?.id ?? null,
          form.getValues(),
        );

        if (!result.success) {
          toast.add({
            type: 'error',
            title: 'Could not save project',
            description: result.message,
          });
          return;
        }

        toast.add({
          type: 'success',
          title: project ? 'Project saved' : 'Project created',
        });
        router.push(`/projects/manage/${result.id}`);
      } catch {
        toast.add({
          type: 'error',
          title: 'Could not save project',
          description: 'Something went wrong. Please try again.',
        });
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mx-auto max-w-2xl space-y-4"
    >
      <AppInfoCard title="Project">
        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              placeholder="Spring Service Week"
              {...form.register('title')}
              aria-invalid={!!form.formState.errors.title}
            />
            <FieldError errors={[form.formState.errors.title]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              rows={6}
              {...form.register('description')}
              aria-invalid={!!form.formState.errors.description}
            />
            <FieldDescription>
              Tell employees what the project is about and why it matters.
            </FieldDescription>
            <FieldError errors={[form.formState.errors.description]} />
          </Field>
        </div>
      </AppInfoCard>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          type="button"
          render={
            <Link
              href={
                project ? `/projects/manage/${project.id}` : '/projects/manage'
              }
            />
          }
          nativeButton={false}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : project ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}
