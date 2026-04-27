import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  closeOptimisticConflictModal,
  useOptimisticConflictModalState,
} from '@/lib/optimistic/conflictModalState';

/** Shown when an optimistic mutation receives HTTP 409 from the server. */
export function OptimisticConflictModal() {
  const { open, title, message } = useOptimisticConflictModalState();

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && closeOptimisticConflictModal()}>
      <AlertDialogContent className="rounded-2xl" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-start whitespace-pre-wrap">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="rounded-xl" onClick={() => closeOptimisticConflictModal()}>
            הבנתי
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
