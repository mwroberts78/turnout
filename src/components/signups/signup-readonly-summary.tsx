import { Clock, Shirt, UtensilsCrossed } from 'lucide-react';
import { tshirtSizeLabels } from '../app-ui/app-tshirt-size';

export function SignupReadOnlySummary({
  estimatedHours,
  wantsMeal,
  mealName,
  wantsTShirt,
  tshirtSize,
  comments,
}: {
  estimatedHours: number;
  wantsMeal: boolean;
  mealName: string | null;
  wantsTShirt: boolean;
  tshirtSize: keyof typeof tshirtSizeLabels | null;
  comments: string | null;
}) {
  return (
    <div className="space-y-3 rounded-md bg-muted/40 p-3 text-sm">
      <div className="flex flex-col gap-y-1.5">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="text-muted-foreground size-4" />
          Est. {estimatedHours} hr{estimatedHours === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UtensilsCrossed className="text-muted-foreground size-4" />
          {wantsMeal && mealName ? mealName : 'No meal requested'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Shirt className="text-muted-foreground size-4" />
          {wantsTShirt && tshirtSize
            ? tshirtSizeLabels[tshirtSize]
            : 'No shirt requested'}
        </span>
      </div>
      {comments && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Comments</p>
          <p className="mt-1 border-l-2 border-muted-foreground/30 pl-2 italic">
            {comments}
          </p>
        </div>
      )}
    </div>
  );
}
