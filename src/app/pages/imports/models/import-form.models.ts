import { FormControl } from '@angular/forms';

import { ClientOptionDto } from '@services/clients/clients.types';
import { ImportPaymentType } from '@services/imports/imports.types';

export interface ImportDetailsFormModel {
  client: FormControl<ClientOptionDto | null>;
  containerNumber: FormControl<string>;
  containerType: FormControl<number | null>;
}

export interface ImportPaymentsFormModel {
  type: FormControl<ImportPaymentType | null>;
  amount: FormControl<number | null>;
  paymentDate: FormControl<Date | null>;
  notes: FormControl<string>;
  importDocumentTypeId: FormControl<string | null>;
}
