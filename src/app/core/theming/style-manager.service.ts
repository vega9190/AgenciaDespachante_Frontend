import { DOCUMENT } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StyleManagerService {
  private readonly document = inject(DOCUMENT);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly renderer: Renderer2;
  private currentStyle: string | null = null;

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  loadStyle(styleName: string, stylesheetPath: string): void {
    if (this.currentStyle === styleName) {
      return;
    }

    if (this.currentStyle) {
      this.removeStyle(this.currentStyle);
    }

    const styleElement = this.renderer.createElement('link');

    this.renderer.setAttribute(styleElement, 'id', this.getStyleId(styleName));
    this.renderer.setAttribute(styleElement, 'rel', 'stylesheet');
    this.renderer.setAttribute(styleElement, 'type', 'text/css');
    this.renderer.setAttribute(styleElement, 'href', stylesheetPath);

    this.renderer.appendChild(this.document.head, styleElement);
    this.currentStyle = styleName;
  }

  removeStyle(styleName: string): void {
    const style = this.document.getElementById(this.getStyleId(styleName));

    if (style) {
      this.renderer.removeChild(this.document.head, style);
    }

    if (this.currentStyle === styleName) {
      this.currentStyle = null;
    }
  }

  private getStyleId(styleName: string): string {
    return `tenant-style-${styleName}`;
  }
}
