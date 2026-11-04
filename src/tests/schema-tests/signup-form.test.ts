import { describe, expect, it } from 'vitest';
import { buildSignupFormSchema } from '@/lib/schemas/signup-form';

const mealA = '11111111-1111-4111-8111-111111111111';
const otherMeal = '22222222-2222-4222-8222-222222222222';

const allPerks = buildSignupFormSchema({
  mealProvided: true,
  tshirtProvided: true,
  mealOptionIds: [mealA],
});

const noPerks = buildSignupFormSchema({
  mealProvided: false,
  tshirtProvided: false,
  mealOptionIds: [],
});

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    estimatedHours: '2',
    wantsMeal: false,
    selectedMeal: null,
    wantsTShirt: false,
    tshirtSize: null,
    comments: null,
    ...overrides,
  };
}

describe('buildSignupFormSchema', () => {
  it('requires estimated hours', () => {
    const result = noPerks.safeParse(baseInput({ estimatedHours: '' }));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['estimatedHours']);
  });

  it('rejects 0, more than 24, and non-numeric hours', () => {
    for (const estimatedHours of ['0', '25', 'abc']) {
      const result = noPerks.safeParse(baseInput({ estimatedHours }));

      expect(result.success).toBe(false);
    }
  });

  it('converts hours to a number', () => {
    const result = noPerks.safeParse(baseInput({ estimatedHours: '3.5' }));

    expect(result.data?.estimatedHours).toBe(3.5);
  });

  it('requires a meal choice when a meal is wanted and options exist', () => {
    const result = allPerks.safeParse(baseInput({ wantsMeal: true }));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['selectedMeal']);
  });

  it("rejects a meal that is not one of this opportunity's options", () => {
    const result = allPerks.safeParse(
      baseInput({ wantsMeal: true, selectedMeal: otherMeal }),
    );

    expect(result.success).toBe(false);
  });

  it('does not require a meal choice when the opportunity has no meal options', () => {
    const schema = buildSignupFormSchema({
      mealProvided: true,
      tshirtProvided: false,
      mealOptionIds: [],
    });

    const result = schema.safeParse(baseInput({ wantsMeal: true }));

    expect(result.data?.wantsMeal).toBe(true);
    expect(result.data?.selectedMeal).toBeNull();
  });

  it('requires a t-shirt size when a t-shirt is wanted', () => {
    const result = allPerks.safeParse(baseInput({ wantsTShirt: true }));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['tshirtSize']);
  });

  it('clears a leftover meal and size when they are no longer wanted', () => {
    const result = allPerks.safeParse(
      baseInput({ selectedMeal: mealA, tshirtSize: 'lg' }),
    );

    expect(result.data?.selectedMeal).toBeNull();
    expect(result.data?.tshirtSize).toBeNull();
  });

  it('forces perks off when the opportunity does not provide them', () => {
    const result = noPerks.safeParse(
      baseInput({ wantsMeal: true, wantsTShirt: true, tshirtSize: 'md' }),
    );

    expect(result.data?.wantsMeal).toBe(false);
    expect(result.data?.wantsTShirt).toBe(false);
    expect(result.data?.tshirtSize).toBeNull();
  });

  it('turns blank comments into null and rejects comments over 500 characters', () => {
    expect(
      noPerks.safeParse(baseInput({ comments: '   ' })).data?.comments,
    ).toBeNull();

    expect(
      noPerks.safeParse(baseInput({ comments: 'a'.repeat(501) })).success,
    ).toBe(false);
  });
});
