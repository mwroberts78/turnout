import { describe, expect, it } from 'vitest';
import { projectFormSchema } from '@/lib/schemas/project-form';

describe('projectFormSchema', () => {
  it('trims the title and turns a blank description into null', () => {
    expect(
      projectFormSchema.parse({ title: '  Earth Week  ', description: '  ' }),
    ).toEqual({ title: 'Earth Week', description: null });
  });

  it('requires a title of at least 2 characters', () => {
    const result = projectFormSchema.safeParse({
      title: ' a ',
      description: null,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['title']);
  });

  it('caps the title and description lengths', () => {
    expect(
      projectFormSchema.safeParse({ title: 'a'.repeat(121), description: null })
        .success,
    ).toBe(false);
    expect(
      projectFormSchema.safeParse({
        title: 'Earth Week',
        description: 'a'.repeat(2001),
      }).success,
    ).toBe(false);
  });
});
