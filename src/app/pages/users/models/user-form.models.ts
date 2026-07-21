import { FormControl } from '@angular/forms';

import { ClientOptionDto } from '@services/clients/clients.types';
import { EmployeeOptionDto } from '@services/employees/employees.types';

export type UserPersonType = 'employee' | 'client';

export interface UserFormModel {
  employee: FormControl<EmployeeOptionDto | null>;
  client: FormControl<ClientOptionDto | null>;
  username: FormControl<string>;
  password: FormControl<string>;
  roleId: FormControl<string | null>;
  isActive: FormControl<boolean>;
}

export interface UserEditFormModel {
  username: FormControl<string>;
  password: FormControl<string>;
  roleId: FormControl<string | null>;
  isActive: FormControl<boolean>;
}
