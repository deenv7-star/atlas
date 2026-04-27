/** Predictable lifecycle for ATLAS forms (booking, guest, payment, maintenance). */
export type FormState =
  | 'idle'
  | 'dirty'
  | 'validating'
  | 'submitting'
  | 'success'
  | 'error';
