import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiBlockService {
  private readonly activeRequests = signal(0);

  readonly isBlocked = this.activeRequests.asReadonly();

  block(): void {
    this.activeRequests.update((count) => count + 1);
  }

  unblock(): void {
    this.activeRequests.update((count) => Math.max(0, count - 1));
  }
}
