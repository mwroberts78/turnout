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

export function AppConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  isDeleting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (isDeleting) {
          eventDetails.cancel();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isDeleting} />}
          >
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
