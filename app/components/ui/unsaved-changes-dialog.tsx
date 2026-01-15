'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UnsavedChangesDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
  title = 'Unsaved Changes',
  description = 'You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.',
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onStay()}>
      <DialogContent data-testid="unsaved-changes-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onStay}
            data-testid="unsaved-changes-stay"
          >
            Stay
          </Button>
          <Button
            variant="danger"
            onClick={onLeave}
            data-testid="unsaved-changes-leave"
          >
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
