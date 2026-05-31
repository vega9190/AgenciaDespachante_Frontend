import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { AiPythonArancelPartidaDto } from '@services/ai/ai.types';
import { AiService } from '@services/ai/ai.service';
import { AppToastService } from '@services/common/app-toast.service';

@Component({
  selector: 'app-tariff-item',
  imports: [FormsModule, ButtonModule, CardModule, InputTextModule],
  templateUrl: './tariff-item.component.html',
  styleUrl: './tariff-item.component.css'
})
export class TariffItemComponent {
  private readonly aiService = inject(AiService);
  private readonly appToastService = inject(AppToastService);

  readonly maxSuggestions = 5;
  readonly query = signal('');
  readonly suggestions = signal<AiPythonArancelPartidaDto[]>([]);
  readonly searchedDescription = signal('');
  readonly errorMessage = signal('');
  readonly isLoading = signal(false);
  readonly hasResults = computed(() => this.suggestions().length > 0);
  readonly showEmptyState = computed(() => !!this.searchedDescription() && !this.hasResults() && !this.errorMessage());
  readonly canSearch = computed(() => this.query().trim().length > 0 && !this.isLoading());

  clearQuery(): void {
    this.query.set('');
    this.resetResults();
  }

  submitSearch(): void {
    const description = this.query().trim();

    if (!description || this.isLoading()) {
      return;
    }

    this.query.set(description);
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.aiService
      .classifyArancel({ description })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (!response?.isValid || !response.data) {
            this.resetResults();
            this.appToastService.showApiMessages(response);
            this.errorMessage.set(this.getResponseErrorMessage(response?.messageList) ?? 'No pudimos clasificar el producto en este momento.');
            return;
          }

          this.searchedDescription.set(response.data.description);
          this.suggestions.set(response.data.partidas.slice(0, this.maxSuggestions));
        },
        error: () => {
          this.resetResults();
          this.errorMessage.set('No pudimos clasificar el producto en este momento.');
          this.appToastService.showServerError('No pudimos clasificar el producto en este momento.');
        }
      });
  }

  private resetResults(): void {
    this.suggestions.set([]);
    this.searchedDescription.set('');
    this.errorMessage.set('');
  }

  private getResponseErrorMessage(messageList: { description: string }[] | null | undefined): string | null {
    const description = messageList?.find((message) => !!message.description?.trim())?.description?.trim();
    return description || null;
  }
}
