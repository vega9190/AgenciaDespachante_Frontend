import { Directive, ElementRef, Renderer2, OnDestroy, AfterViewInit } from '@angular/core';

@Directive({
  selector: 'p-table',
  standalone: true
})
export class ResponsiveTableDirective implements AfterViewInit, OnDestroy {
  private observer?: MutationObserver;

  constructor(private elementRef: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    const datatable = this.elementRef.nativeElement;

    this.renderer.addClass(datatable, 'app-responsive-table');
    this.syncLabels();

    this.observer = new MutationObserver(() => this.syncLabels());
    const tbody = datatable.querySelector('.p-datatable-tbody');
    if (tbody) {
      this.observer.observe(tbody, { childList: true, subtree: true });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private syncLabels(): void {
    const datatable = this.elementRef.nativeElement;

    const headerRow = datatable.querySelector('.p-datatable-thead > tr');
    const tbody = datatable.querySelector('.p-datatable-tbody');
    if (!headerRow || !tbody) return;

    const headers = Array.from(headerRow.querySelectorAll('th')).map((th) => th.textContent?.trim() ?? '');
    if (headers.length === 0) return;

    const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll(':scope > td'));
      if (cells.length !== headers.length) continue;

      cells.forEach((cell, index) => {
        const label = headers[index];
        if (label) {
          this.renderer.setAttribute(cell, 'data-label', label);
        }
      });
    }
  }
}
