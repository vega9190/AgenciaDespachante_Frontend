import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-image-single-selector',
  imports: [ButtonModule],
  templateUrl: './image-single-selector.component.html',
  styleUrl: './image-single-selector.component.css'
})
export class ImageSingleSelectorComponent {
  readonly imageUrl = input<string | null>(null);
  readonly fileName = input<string | null>(null);
  readonly disabled = input(false);
  readonly isLoading = input(false);
  readonly emptyTitle = input('Arrastra un archivo aquí o selecciona uno desde tu equipo.');
  readonly emptySubtitle = input('');
  readonly helperText = input('Formatos permitidos: JPG y PNG. Tamaño máximo: 5 MB.');
  readonly accept = input('.jpg,.jpeg,.png');
  readonly maxFileSizeBytes = input(5 * 1024 * 1024);

  readonly fileSelected = output<File>();
  readonly downloadRequested = output<void>();
  readonly deleteRequested = output<void>();

  readonly validationMessage = signal('');
  readonly isDragActive = signal(false);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  openFileDialog(): void {
    if (this.disabled() || this.isLoading()) {
      return;
    }

    this.fileInput()?.nativeElement.click();
  }

  onFileInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.item(0) ?? null;

    this.processFile(file);
    inputElement.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();

    if (this.disabled() || this.isLoading() || this.imageUrl()) {
      return;
    }

    this.isDragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);

    if (this.disabled() || this.isLoading() || this.imageUrl()) {
      return;
    }

    const file = event.dataTransfer?.files.item(0) ?? null;
    this.processFile(file);
  }

  onDownloadClick(): void {
    if (!this.fileName() || this.isLoading()) {
      return;
    }

    this.downloadRequested.emit();
  }

  onDeleteClick(): void {
    if (this.disabled() || this.isLoading() || !this.imageUrl()) {
      return;
    }

    this.deleteRequested.emit();
  }

  private processFile(file: File | null): void {
    if (!file || this.disabled() || this.isLoading()) {
      return;
    }

    const validationMessage = this.getValidationMessage(file);

    if (validationMessage) {
      this.validationMessage.set(validationMessage);
      return;
    }

    this.validationMessage.set('');
    this.fileSelected.emit(file);
  }

  private getValidationMessage(file: File): string {
    const acceptedExtensions = this.accept()
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);

    const fileName = file.name.toLowerCase();
    const hasValidExtension = acceptedExtensions.some((extension) => fileName.endsWith(extension));

    if (!hasValidExtension) {
      return 'Solo se permiten archivos JPG o PNG.';
    }

    if (file.size > this.maxFileSizeBytes()) {
      return 'El archivo no puede superar los 5 MB.';
    }

    return '';
  }
}
