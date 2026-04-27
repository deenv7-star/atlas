import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent, type ChangeEvent } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type Path,
  type PathValue,
  type SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBlocker } from 'react-router-dom';
import type { z } from 'zod';
import type { FormState } from '@/hooks/formMachineTypes';

export type { FormState } from '@/hooks/formMachineTypes';

export type UseFormMachineOptions<TFieldValues extends FieldValues> = {
  schema: z.ZodType<TFieldValues, z.ZodTypeDef, unknown>;
  defaultValues: DefaultValues<TFieldValues>;
  onSubmit: (data: TFieldValues) => Promise<void>;
  /** sessionStorage key — unique per form instance (e.g. include id for edit) */
  storageKey: string;
  /** When true, SPA navigations are blocked while dirty or error */
  enableRouteGuard?: boolean;
  /** Called right after a successful submit (e.g. schedule dialog close after 2s). */
  onAfterSubmitSuccess?: () => void;
};

function flattenFieldErrors<T extends FieldValues>(errors: FieldErrors<T>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(errors) as Array<Path<T> & string>) {
    const err = errors[key as keyof FieldErrors<T>];
    if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
      out[key] = err.message;
    }
  }
  return out;
}

function safeLoadStorage<T>(key: string): Partial<T> | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<T>;
  } catch {
    return null;
  }
}

function safeSaveStorage<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

function clearStorage(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function toHebrewServerMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    const m = (err as { message: string }).message;
    if (m) return m;
  }
  if (typeof err === 'string' && err) return err;
  return 'השמירה נכשלה. נסו שוב או פנו לתמיכה.';
}

export function useFormMachine<TFieldValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  storageKey,
  enableRouteGuard = false,
  onAfterSubmitSuccess,
}: UseFormMachineOptions<TFieldValues>) {
  const [machineState, setMachineState] = useState<FormState>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [validatingFields, setValidatingFields] = useState<ReadonlySet<string>>(new Set());
  const machineRef = useRef(machineState);
  machineRef.current = machineState;

  const mergedDefaults = useMemo(() => {
    const stored = safeLoadStorage<TFieldValues>(storageKey);
    return { ...defaultValues, ...(stored ?? {}) } as DefaultValues<TFieldValues>;
  }, [defaultValues, storageKey]);

  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues: mergedDefaults,
    mode: 'onTouched',
  });

  const { watch, setValue, reset, handleSubmit: rhfHandleSubmit, formState, getValues, register, control } = form;

  useEffect(() => {
    const sub = watch((value) => {
      safeSaveStorage(storageKey, value as TFieldValues);
    });
    return () => sub.unsubscribe();
  }, [watch, storageKey]);

  useEffect(() => {
    if (formState.isDirty && machineRef.current === 'idle') {
      setMachineState('dirty');
    }
  }, [formState.isDirty]);

  useEffect(() => {
    if (machineState !== 'success') return undefined;
    const t = window.setTimeout(() => {
      setMachineState('idle');
      clearStorage(storageKey);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [machineState, storageKey]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (machineRef.current === 'dirty' || machineRef.current === 'error') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        if (!enableRouteGuard) return false;
        const s = machineRef.current;
        if (s !== 'dirty' && s !== 'error') return false;
        return (
          currentLocation.pathname !== nextLocation.pathname ||
          currentLocation.search !== nextLocation.search ||
          currentLocation.hash !== nextLocation.hash
        );
      },
      [enableRouteGuard],
    ),
  );

  const handleBlur = useCallback(
    async (name: Path<TFieldValues>) => {
      setValidatingFields((prev) => new Set(prev).add(String(name)));
      setMachineState((prev) => (prev === 'idle' ? 'dirty' : prev === 'error' ? 'dirty' : prev));
      try {
        await form.trigger(name);
      } finally {
        setValidatingFields((prev) => {
          const next = new Set(prev);
          next.delete(String(name));
          return next;
        });
      }
    },
    [form],
  );

  const mergeRegister = useCallback(
    (name: Path<TFieldValues>) => {
      const reg = register(name);
      return {
        ...reg,
        onBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          void handleBlur(name);
          reg.onBlur(e);
        },
        onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          if (machineRef.current === 'error') {
            setMachineState('dirty');
            setServerError(null);
          }
          reg.onChange(e);
        },
      };
    },
    [register, handleBlur],
  );

  const handleChange = useCallback(
    <K extends Path<TFieldValues>>(name: K, value: PathValue<TFieldValues, K>) => {
      if (machineRef.current === 'error') {
        setMachineState('dirty');
        setServerError(null);
      }
      setValue(name, value, { shouldDirty: true, shouldValidate: false });
    },
    [setValue],
  );

  const onValid: SubmitHandler<TFieldValues> = useCallback(
    async (data) => {
      setMachineState('submitting');
      setServerError(null);
      try {
        await onSubmit(data);
        setMachineState('success');
        onAfterSubmitSuccess?.();
      } catch (err) {
        setMachineState('error');
        setServerError(toHebrewServerMessage(err));
      }
    },
    [onSubmit, onAfterSubmitSuccess],
  );

  const onInvalid = useCallback(() => {
    setMachineState('dirty');
  }, []);

  const handleSubmit = useCallback(() => {
    setMachineState('validating');
    void rhfHandleSubmit(onValid, onInvalid)();
  }, [rhfHandleSubmit, onValid, onInvalid]);

  const resetAll = useCallback(
    (next?: DefaultValues<TFieldValues>) => {
      clearStorage(storageKey);
      reset(next ?? defaultValues);
      setMachineState('idle');
      setServerError(null);
    },
    [reset, defaultValues, storageKey],
  );

  const interceptDialogClose = useCallback(
    (nextOpen: boolean, setOpen: (value: boolean) => void) => {
      if (
        !nextOpen &&
        (machineRef.current === 'dirty' || machineRef.current === 'error')
      ) {
        const ok = window.confirm('יש לך שינויים שלא נשמרו. לצאת בכל זאת?');
        if (!ok) return;
        resetAll();
      }
      setOpen(nextOpen);
    },
    [resetAll],
  );

  const values = watch();
  const flatErrors = useMemo(() => flattenFieldErrors(form.formState.errors), [form.formState.errors]);

  const isFieldValidating = useCallback((name: string) => validatingFields.has(name), [validatingFields]);

  return {
    state: machineState,
    values,
    errors: flatErrors,
    fieldErrors: form.formState.errors,
    handleChange,
    handleBlur,
    handleSubmit,
    reset: resetAll,
    isDirty: formState.isDirty,
    serverError,
    register: mergeRegister,
    setValue,
    getValues,
    control,
    form,
    isFieldValidating,
    blocker,
    interceptDialogClose,
  };
}
