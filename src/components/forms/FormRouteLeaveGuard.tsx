import * as React from 'react';
import type { Blocker } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type FormRouteLeaveGuardProps = {
  blocker: Blocker;
};

/** Confirms SPA navigation away when react-router `useBlocker` is in `blocked` state. */
export function FormRouteLeaveGuard({ blocker }: FormRouteLeaveGuardProps) {
  const open = blocker.state === 'blocked';

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && blocker.reset?.()}>
      <AlertDialogContent className="rounded-2xl" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>לצאת בלי לשמור?</AlertDialogTitle>
          <AlertDialogDescription className="text-start">
            יש לך שינויים שלא נשמרו. לצאת בכל זאת?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="rounded-xl" onClick={() => blocker.reset?.()}>
            להישאר
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            onClick={() => blocker.proceed?.()}
          >
            לצאת בכל זאת
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
