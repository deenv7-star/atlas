import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormState } from '@/hooks/formMachineTypes';

export function FormMachineErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
      dir="rtl"
    >
      {message}
    </div>
  );
}

export function FormMachineFieldHint({
  error,
  validating,
}: {
  error?: string;
  validating?: boolean;
}) {
  if (validating) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-0.5" aria-live="polite">
        <Loader2 className="h-3 w-3 animate-spin shrink-0" aria-hidden />
        בודקים…
      </span>
    );
  }
  if (error) {
    return (
      <p className="text-xs text-red-600 mt-0.5" role="alert">
        {error}
      </p>
    );
  }
  return null;
}

export function formMachineFormClassName(state: FormState): string {
  return cn(state === 'submitting' && 'opacity-70 pointer-events-none transition-opacity duration-200');
}
