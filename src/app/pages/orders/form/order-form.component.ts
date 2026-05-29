import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

import { ORDER_STATUS_IDS, ORDER_TIMELINE_STEPS } from '@services/orders/order-status.constants';
import { CONTAINER_TYPE_OPTIONS, OrderDetailDto } from '@services/orders/orders.types';
import { OrdersService } from '@services/orders/orders.service';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrderDocumentsComponent } from './order-documents/order-documents.component';
import { OrderPaymentsComponent } from './order-payments/order-payments.component';

@Component({
  selector: 'app-order-form',
  imports: [DatePipe, CardModule, ConfirmDialogModule, Tabs, TabList, Tab, TabPanels, TabPanel, OrderDetailsComponent, OrderDocumentsComponent, OrderPaymentsComponent],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal(false);
  readonly order = signal<OrderDetailDto | null>(null);
  readonly orderId = signal<string | null>(null);
  readonly containerTypeOptions = CONTAINER_TYPE_OPTIONS;
  readonly orderTimelineSteps = ORDER_TIMELINE_STEPS;
  readonly activeEditTab = signal('details');
  readonly isEditMode = computed(() => this.orderId() !== null);
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Pedido' : 'Crear Pedido'));

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      this.orderId.set(id);

      if (id) {
        this.loadOrder(id);
        return;
      }

      this.order.set(null);
    });
  }

  onOrderChanged(order: OrderDetailDto): void {
    this.order.set(order);
  }

  getCurrentTimelineStepIndex(statusId: string | null | undefined): number {
    if (!statusId || this.isCancelledStatus(statusId)) {
      return -1;
    }

    const normalizedStatusId = statusId.toLowerCase();
    return this.orderTimelineSteps.findIndex((step) => step.statusId.toLowerCase() === normalizedStatusId);
  }

  isCompletedTimelineStep(stepIndex: number, currentStepIndex: number): boolean {
    return currentStepIndex > -1 && stepIndex < currentStepIndex;
  }

  isCurrentTimelineStep(stepIndex: number, currentStepIndex: number): boolean {
    return currentStepIndex > -1 && stepIndex === currentStepIndex;
  }

  getTimelineConnectorState(stepIndex: number, currentStepIndex: number): 'completed' | 'pending' {
    return currentStepIndex > stepIndex ? 'completed' : 'pending';
  }

  private isCancelledStatus(statusId: string): boolean {
    return statusId.toLowerCase() === ORDER_STATUS_IDS.cancelado.toLowerCase();
  }

  private loadOrder(id: string): void {
    this.isLoading.set(true);

    this.ordersService
      .getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        this.order.set(response.data ?? null);
      });
  }
}
