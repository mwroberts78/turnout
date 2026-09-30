import { Button } from '../base-ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../base-ui/dialog';

export function AppConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  isPending,
  onConfirm,
  confirmLabel,
  pendingLabel,
  variant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel: string;
  pendingLabel: string;
  variant: 'destructive' | 'default';
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (isPending) {
          eventDetails.cancel();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isPending} />}
          >
            Cancel
          </DialogClose>
          <Button variant={variant} onClick={onConfirm} disabled={isPending}>
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
