export type FieldErrors = Record<string, string>;

export type ActionSuccess<T> = {
  ok: true;
  data: T;
  message?: string;
};

export type ActionFailure = {
  ok: false;
  code: string;
  formError?: string;
  fieldErrors?: FieldErrors;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function success<T>(data: T, message?: string): ActionSuccess<T> {
  return { ok: true, data, message };
}

export function failure(
  code: string,
  formError?: string,
  fieldErrors?: FieldErrors
): ActionFailure {
  return { ok: false, code, formError, fieldErrors };
}
