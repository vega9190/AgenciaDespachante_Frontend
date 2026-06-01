export interface ClientConfig {
  key: string;
  theme?: string | null;
}

export type ColorPalette = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

export interface Theme {
  palette: ColorPalette;
  primaryShade: keyof ColorPalette;
  secondaryColor: string;
  secondaryHoverColor: string;
  secondaryActiveColor: string;
  secondaryContrastColor: string;
  tertiaryColor: string;
  tertiaryHoverColor: string;
  tertiaryActiveColor: string;
  tertiaryContrastColor: string;
  layoutBackground: string;
  layoutSurface: string;
  layoutSurfaceOverlay: string;
  layoutBorder: string;
  layoutHighlight: string;
  layoutText: string;
  layoutTextMuted: string;
  contentBackground: string;
  contentBorder: string;
  contentShadow: string;
  overlayShadow: string;
  overlayBackdrop: string;
  successColor: string;
  successSurface: string;
  dangerColor: string;
  dangerSurface: string;
}
