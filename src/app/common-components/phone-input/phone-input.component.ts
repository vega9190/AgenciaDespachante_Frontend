import { Component, OnInit, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-phone-input',
  imports: [ReactiveFormsModule, InputTextModule],
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.css'
})
export class AppPhoneInputComponent implements OnInit {
  readonly control = input.required<FormControl<string>>();
  readonly inputId = input('phone');
  readonly placeholder = input('710-12345');
  readonly ariaLabelledBy = input<string | null>(null);

  ngOnInit(): void {
    this.control().setValue(this.formatPhone(this.control().value ?? ''), { emitEvent: false });
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formattedValue = this.formatPhone(input.value);

    input.value = formattedValue;
    this.control().setValue(formattedValue, { emitEvent: false });

    queueMicrotask(() => {
      const caretPosition = formattedValue.length;
      input.setSelectionRange(caretPosition, caretPosition);
    });
  }

  private formatPhone(value: string): string {
    const digits = value.replace(/\D+/g, '').slice(0, 8);

    if (digits.length <= 3) {
      return digits;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
}
