import { HttpParams } from '@angular/common/http';

export function buildHttpParams<T extends object>(query: T): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(query) as Array<[string, string | number | boolean | null | undefined]>) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    params = params.set(key, String(value));
  }

  return params;
}

export function formatDateForBackend(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
