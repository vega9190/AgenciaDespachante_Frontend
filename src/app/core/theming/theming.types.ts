export interface AssetsConfig {
  favicon?: string | null;
  logo?: string | null;
  styleSheet?: string | null;
}

export interface ClientConfig {
  key: string;
  loginTitle: string;
  loginSubTitle?: string | null;
  siteTitle?: string;
  theme?: string | null;
  assetsConfig?: AssetsConfig | null;
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
}
