import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '@core/auth/auth.service';
import { LayoutService } from '@layout/service/app.layout.service';
import { TenantIdentityStoreService } from '@services/tenant/tenant-identity-store.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgClass, InputTextModule, ButtonModule, CheckboxModule, InputGroup, InputGroupAddonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly layoutService = inject(LayoutService);

  readonly tenantIdentityStore = inject(TenantIdentityStoreService);
  readonly isSubmitting = signal(false);
  readonly isUnauthorized = signal(false);
  readonly isFilledInput = computed(() => this.layoutService.config.inputStyle === 'filled');
  readonly shouldShowValidationErrors = computed(() => this.isSubmitting() && this.loginForm.invalid);

  readonly loginForm: FormGroup = this.formBuilder.group({
    user: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    rememberUserId: new FormControl(true)
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onLoginSubmit(): Promise<void> {
    this.isSubmitting.set(true);

    if (this.loginForm.invalid) {
      this.isSubmitting.set(false);
      return;
    }

    const { user, password } = this.loginForm.getRawValue();
    const isValid = await this.authService.login({ user: user ?? '', password: password ?? '' });

    if (!isValid) {
      this.isUnauthorized.set(true);
      this.isSubmitting.set(false);
      return;
    }

    this.isUnauthorized.set(false);
    await this.router.navigate(['/dashboard']);
    this.isSubmitting.set(false);
  }
}
