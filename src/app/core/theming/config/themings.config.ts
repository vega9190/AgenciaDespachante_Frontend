import { seedPurplePalette } from './color-palettes.config';
import { Theme } from '../theming.types';

export const themes: Record<string, Theme> = {
  default: {
    palette: seedPurplePalette,
    primaryShade: 600
  }
};
