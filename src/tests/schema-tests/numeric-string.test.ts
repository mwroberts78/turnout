import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { numericStringToNullable } from '@/lib/schemas/numeric-string';

const schema = numericStringToNullable(z.number().int().positive());

describe('numericStringToNullable', () => {
  it('turns an empty string into null', () => {
    expect(schema.safeParse('').data).toBeNull();
  });

  it('turns whitespace into null', () => {
    expect(schema.safeParse(' ').data).toBeNull();
  });

  it('turns positive whole number string into number', () => {
    expect(schema.safeParse('5').data).toBe(5);
  });

  it('errors on zero string', () => {
    expect(schema.safeParse('0').success).toBe(false);
  });

  it('errors on decimal string', () => {
    expect(schema.safeParse('2.5').success).toBe(false);
  });

  it('errors on alpha string value', () => {
    expect(schema.safeParse('abc').success).toBe(false);
  });

  it('errors on negative numeric value', () => {
    expect(schema.safeParse('-1').success).toBe(false);
  });
});
