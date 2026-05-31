export interface ProcessAiOcrRequest {
  file: File;
}

export interface ClassifyArancelRequest {
  description: string;
}

export interface ClassifyArancelBatchItemRequest {
  id: string;
  description: string;
}

export interface ClassifyArancelBatchRequest {
  items: ClassifyArancelBatchItemRequest[];
}

export interface ProviderDto {
  name?: string | null;
  address?: string | null;
  refNumber?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  city?: string | null;
}

export interface InvoiceItemDto {
  name?: string | null;
  comercialDescription?: string | null;
  type?: string | null;
  class?: string | null;
  model?: string | null;
  composition?: string | null;
  otherDetails?: string | null;
  year?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  amount?: number | null;
}

export interface InvoiceDto {
  provider: ProviderDto;
  invoiceNumber?: string | null;
  customerId?: string | null;
  totalAmount?: number | null;
  date?: string | null;
  totalItems?: number | null;
  items: InvoiceItemDto[];
}

export interface PlaceDto {
  destinationCountry?: string | null;
  originCountry?: string | null;
  transitCountry?: string | null;
  transitCity?: string | null;
  portOfLoading?: string | null;
  countryOfLoading?: string | null;
}

export interface BolItemDto {
  quantity?: number | null;
  description?: string | null;
  weight?: number | null;
}

export interface BolDto {
  consigneeDocNumber?: string | null;
  shipperDocNumber?: string | null;
  bolNumber?: string | null;
  date?: string | null;
  place: PlaceDto;
  totalWeight?: number | null;
  totalPackages?: number | null;
  totalItems?: number | null;
  items: BolItemDto[];
}

export interface ProcessInvoiceOcrResponseDto {
  rawOcr: string;
  message: string;
  isError: boolean;
  invoice: InvoiceDto;
}

export interface ProcessBolOcrResponseDto {
  rawOcr: string;
  message: string;
  isError: boolean;
  bol: BolDto;
}

export interface AiPythonArancelPartidaDto {
  code: string;
  description: string;
  reasoning: string;
}

export interface AiPythonArancelClassifyResponseDto {
  description: string;
  partidas: AiPythonArancelPartidaDto[];
}

export interface AiPythonArancelBatchResultItemDto {
  id: string;
  description: string;
  partidas: AiPythonArancelPartidaDto[];
}

export interface AiPythonArancelBatchResponseDto {
  results: AiPythonArancelBatchResultItemDto[];
}
