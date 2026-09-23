import { CirclePlusIcon, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { z } from 'zod';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { Button } from '@/components/base-ui/button';
import { FieldError } from '@/components/base-ui/field';
import { Input } from '@/components/base-ui/input';
import type { OpportunityFormSchema } from '@/lib/schemas/opportunity-form';

export function EditOpportunityMealOptions({
  usageByOptionId,
}: {
  usageByOptionId: Record<string, number>;
}) {
  const form = useFormContext<z.input<OpportunityFormSchema>>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'mealOptions',
  });

  return (
    <AppInfoCard
      title="Meal options"
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ mealName: '' })}
        >
          <CirclePlusIcon /> Add Meal Option
        </Button>
      }
    >
      <div className="space-y-2">
        {fields.map((field, index) => {
          const used = field.mealOptionId
            ? (usageByOptionId[field.mealOptionId] ?? 0)
            : 0;

          return (
            <div key={field.id}>
              <div className="flex items-center gap-2">
                <Input
                  {...form.register(`mealOptions.${index}.mealName`)}
                  placeholder="Meal name"
                  aria-invalid={
                    !!form.formState.errors.mealOptions?.[index]?.mealName
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remove meal option"
                  disabled={used > 0}
                  onClick={() => remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
              <FieldError
                errors={[form.formState.errors.mealOptions?.[index]?.mealName]}
              />
              {used > 0 && (
                <p className="text-muted-foreground text-xs">
                  {used} signup{used === 1 ? '' : 's'} selected this meal
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* <FormField
        name="variants"
        control={form.control}
        render={({ field }) => (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-flow-col">
              <FormItem>
                <FormLabel>Options</FormLabel>
                <Select {...field}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="size">Size</SelectItem>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="smell">Smell</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>
            <div className="grid gap-4 lg:grid-flow-col">
              <FormItem>
                <Select {...field}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="size">Size</SelectItem>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="weight">Weight</SelectItem>
                      <SelectItem value="smell">Smell</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>
          </div>
        )}
      /> */}
    </AppInfoCard>
  );
}
