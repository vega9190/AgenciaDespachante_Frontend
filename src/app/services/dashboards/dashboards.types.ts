import { ImportPaymentType } from '../imports/imports.types';

export interface DashboardSummaryQuery {
  dateFrom?: string;
  dateTo?: string;
}

export interface StatusCountDto {
  statusId: string;
  statusName: string;
  count: number;
}

export interface PaymentTypeBreakdownDto {
  type: ImportPaymentType;
  totalAmount: number;
}

export interface DriverTransportCardExpiringDto {
  driverId: string;
  driverNumber: number;
  name: string;
  lastName: string;
  transportCardExpirationDate: string;
  daysRemaining: number;
}

export interface DashboardFinancialSummaryDto {
  totalCharged: number;
  totalCollected: number;
  totalPending: number;
  ganancia: number;
  importsByStatus: StatusCountDto[];
  paymentsByType: PaymentTypeBreakdownDto[];
}

export interface DashboardLogisticsSummaryDto {
  shipmentsByStatus: StatusCountDto[];
  averageTransitDays: number;
  activeDriversCount: number;
  driversTransportCardExpiringSoon: DriverTransportCardExpiringDto[];
  newClientsCount: number;
  newDriversCount: number;
}
