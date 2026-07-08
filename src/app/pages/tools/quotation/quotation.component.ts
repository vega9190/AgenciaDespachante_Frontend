import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { QuotationReportRequest, ReportsService } from '@services/reports/reports.service';
import { TenantSettingsService } from '@services/tenant/tenant-settings.service';

@Component({
  selector: 'app-quotation',
  imports: [
    FormsModule,
    ButtonModule,
    InputGroup,
    InputGroupAddonModule,
    InputNumberModule,
    InputTextModule,
    ToggleSwitchModule
  ],
  templateUrl: './quotation.component.html',
  styleUrl: './quotation.component.css'
})
export class QuotationComponent implements OnInit {
  private readonly tenantSettingsService = inject(TenantSettingsService);
  private readonly reportsService = inject(ReportsService);
  private readonly uiBlockService = inject(UiBlockService);
  private readonly appToastService = inject(AppToastService);

  readonly itemName = signal('');
  readonly tariffItem = signal('');
  readonly landFreightCost = signal<number | null>(null);
  readonly itemAmount = signal<number | null>(null);
  readonly seaFreightCost = signal<number | null>(null);
  readonly insuranceRate = signal<number | null>(null);
  readonly generalTariff = signal<number | null>(null);
  readonly iva = signal<number | null>(null);
  readonly applyIce = signal(false);
  readonly iceRate = signal<number>(10);
  readonly parallelExchangeRate = signal<number | null>(null);

  readonly itemPrice = computed(() => this.itemAmount() ?? 0);
  readonly canDownloadQuotation = computed(() => this.itemName().trim().length > 0 && this.itemPrice() > 0);
  readonly totalFreight = computed(() => (this.landFreightCost() ?? 0) + (this.seaFreightCost() ?? 0));
  readonly insuranceAmount = computed(() => (this.itemPrice() * (this.insuranceRate() ?? 0)) / 100);
  readonly cif = computed(() => this.itemPrice() + this.totalFreight() + this.insuranceAmount());
  readonly gaAmount = computed(() => (this.cif() * (this.generalTariff() ?? 0)) / 100);
  readonly ivaAmount = computed(() => (this.cif() * (this.iva() ?? 0)) / 100);
  readonly iceAmount = computed(() => (this.applyIce() ? (this.cif() * this.iceRate()) / 100 : 0));
  readonly totalTaxes = computed(() => this.gaAmount() + this.ivaAmount() + this.iceAmount());
  readonly estimated = computed(() => this.cif() + this.totalTaxes());

  ngOnInit(): void {
    this.tenantSettingsService.getSettings().subscribe({
      next: (result) => {
        this.insuranceRate.set(result.data?.insuranceRate ?? null);
        this.iva.set(result.data?.iva ?? null);
        this.iceRate.set(result.data?.ice ?? 10);
        this.parallelExchangeRate.set(result.data?.parallelExchangeRate ?? null);
      }
    });
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  downloadQuotation(): void {
    const request: QuotationReportRequest = {
      item: this.itemName().trim(),
      tariffItem: this.tariffItem().trim() || null,
      itemPrice: this.itemPrice(),
      landFreightPrice: this.landFreightCost(),
      maritimeFreightPrice: this.seaFreightCost(),
      assurancePercent: this.insuranceRate(),
      assuranceTotal: this.insuranceAmount(),
      gaPercent: this.generalTariff(),
      gaTotal: this.gaAmount(),
      ivaPercent: this.iva(),
      ivaTotal: this.ivaAmount(),
      icePercent: this.applyIce() ? this.iceRate() : null,
      iceTotal: this.iceAmount(),
      total: this.estimated()
    };

    this.uiBlockService.block();
    this.reportsService.downloadQuotation(request)
      .pipe(finalize(() => this.uiBlockService.unblock()))
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) return;

          const fileName = this.getReportFileName(response.headers.get('content-disposition'));
          const objectUrl = URL.createObjectURL(blob);
          const link = globalThis.document.createElement('a');

          link.href = objectUrl;
          link.download = fileName;
          link.click();

          URL.revokeObjectURL(objectUrl);
        },
        error: () => {
          this.appToastService.showServerError('No se pudo descargar la cotización.');
        }
      });
  }

  private getReportFileName(contentDisposition: string | null): string {
    const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    if (encoded) return decodeURIComponent(encoded);

    const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]?.trim();
    return plain ?? 'Cotizacion.pdf';
  }
}
