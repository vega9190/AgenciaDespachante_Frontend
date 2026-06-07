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
