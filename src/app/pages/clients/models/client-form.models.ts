import { FormControl } from '@angular/forms';

export interface ClientFormModel {
  companyName: FormControl<string>;
  contactName: FormControl<string>;
  address: FormControl<string>;
  contactPhone: FormControl<string>;
  taxId: FormControl<string>;
  isActive: FormControl<boolean>;
}
