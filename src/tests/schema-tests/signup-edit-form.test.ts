import { describe, expect, it } from 'vitest';
import { signupEditFormSchema } from '@/lib/schemas/signup-edit-form';

describe('signupEditFormSchema', () => {
  it('accepts a blank actualHours as null', () => {
    const result = signupEditFormSchema.safeParse({
      workCompleted: true,
      actualHours: '',
    });

    expect(result.data?.actualHours).toBeNull();
  });

  it('rejects negative hours and points the error at actualHours', () => {
    const result = signupEditFormSchema.safeParse({
      workCompleted: true,
      actualHours: '-1',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['actualHours']);
  });

  it('returns numeric actualHours when given string actualHours', () => {
    const result = signupEditFormSchema.safeParse({
      workCompleted: true,
      actualHours: '3.5',
    });

    expect(result.data?.actualHours).toBe(3.5);
  });

  it('accepts "0" as actualHours', () => {
    const result = signupEditFormSchema.safeParse({
      workCompleted: true,
      actualHours: '0',
    });

    expect(result.data?.actualHours).toBe(0);
  });

  it('rejects workCompleted: "true" as string and points the error at workCompleted', () => {
    const result = signupEditFormSchema.safeParse({
      workCompleted: 'true',
      actualHours: '3.5',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['workCompleted']);
  });

  it('rejects having workCompleted being left out and points the error at workCompleted', () => {
    const result = signupEditFormSchema.safeParse({
      actualHours: '3.5',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['workCompleted']);
  });
});
