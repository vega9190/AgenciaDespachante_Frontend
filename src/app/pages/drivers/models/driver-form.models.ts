import { FormControl } from '@angular/forms';

export interface DriverFormModel {
  name: FormControl<string>;
  lastName: FormControl<string>;
  phoneNumber: FormControl<string>;
  isExternal: FormControl<boolean | null>;
  isActive: FormControl<boolean>;
  transportCardExpirationDate: FormControl<Date | null>;
}

export interface DriverTypeOption {
  label: string;
  value: boolean;
}

export type DriverDocumentSide = 'front' | 'back';

export interface DriverDocumentVm {
  fileName: string | null;
  imageUrl: string | null;
  blob: Blob | null;
  isLoading: boolean;
}

export interface DriverDocumentsState {
  front: DriverDocumentVm;
  back: DriverDocumentVm;
}
