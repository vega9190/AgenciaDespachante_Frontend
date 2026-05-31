import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';

import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-file-selector',
  imports: [ButtonModule],
  templateUrl: './file-selector.component.html',
  styleUrl: './file-selector.component.css'
})
export class FileSelectorComponent {
  readonly accept = input('.pdf,.xls,.xlsx,.jpg,.jpeg,.png');
  readonly helperText = input('Formatos permitidos: PDF, XLS, XLSX, JPG y PNG. Tamaño maximo: 5 MB.');
  readonly maxFileSizeBytes = input(5 * 1024 * 1024);
  readonly selectedFile = input<File | null>(null);
  readonly disabled = input(false);

  readonly fileSelected = output<File>();
  readonly fileCleared = output<void>();

  readonly validationMessage = signal('');
  readonly isDragActive = signal(false);

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  openFileDialog(): void {
    if (this.disabled()) {
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

    if (this.disabled()) {
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

    if (this.disabled()) {
      return;
    }

    const file = event.dataTransfer?.files.item(0) ?? null;
    this.processFile(file);
  }

  clearSelectedFile(): void {
    this.validationMessage.set('');
    this.fileCleared.emit();
  }

  private processFile(file: File | null): void {
    if (!file) {
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
      return `Solo se permiten archivos ${this.formatAcceptedExtensions(acceptedExtensions)}.`;
    }

    if (file.size > this.maxFileSizeBytes()) {
      return 'El archivo no puede superar los 5 MB.';
    }

    return '';
  }

  private formatAcceptedExtensions(acceptedExtensions: string[]): string {
    const labels = acceptedExtensions
      .map((extension) => extension.replace(/^\./, '').trim().toUpperCase())
      .filter((extension, index, allExtensions) => extension.length > 0 && allExtensions.indexOf(extension) === index);

    if (labels.length === 0) {
      return 'validos';
    }

    if (labels.length === 1) {
      return labels[0];
    }

    if (labels.length === 2) {
      return `${labels[0]} o ${labels[1]}`;
    }

    return `${labels.slice(0, -1).join(', ')} o ${labels[labels.length - 1]}`;
  }
}
