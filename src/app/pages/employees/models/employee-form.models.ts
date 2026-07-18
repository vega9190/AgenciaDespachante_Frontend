import { FormControl } from '@angular/forms';

export interface EmployeeFormModel {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  address: FormControl<string>;
  phone: FormControl<string>;
  nationalId: FormControl<string>;
  isActive: FormControl<boolean>;
}
