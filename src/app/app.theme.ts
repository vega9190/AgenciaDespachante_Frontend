import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

import { ThemeType } from 'primeng/config';

import { seedPurplePalette } from '@core/theming/config/color-palettes.config';

const theme: ThemeType = {
  preset: definePreset(Aura, {
    semantic: {
      primary: seedPurplePalette,
      colorScheme: {
        light: {
          primary: {
            color: '{primary.600}',
            hoverColor: '{primary.700}',
            activeColor: '{primary.800}'
          },
          highlight: {
            background: '{primary.50}',
            focusBackground: '{primary.100}',
            color: '{primary.700}',
            focusColor: '{primary.800}'
          },
          surface: {
            0: '#ffffff',
            50: '{slate.50}',
            100: '{slate.100}',
            200: '{slate.200}',
            300: '{slate.300}',
            400: '{slate.400}',
            500: '{slate.500}',
            600: '{slate.600}',
            700: '{slate.700}',
            800: '{slate.800}',
            900: '{slate.900}',
            950: '{slate.950}'
          },
          formField: {
            hoverBorderColor: '{primary.color}'
          }
        },
        dark: {
          surface: {
            0: '#ffffff',
            50: '{slate.50}',
            100: '{slate.100}',
            200: '{slate.200}',
            300: '{slate.300}',
            400: '{slate.400}',
            500: '{slate.500}',
            600: '{slate.600}',
            700: '{slate.700}',
            800: '{slate.800}',
            900: '{slate.900}',
            950: '{slate.950}'
          },
          formField: {
            hoverBorderColor: '{primary.400}'
          }
        }
      },
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: 'none'
      }
    }
  }),
  options: {
    darkModeSelector: '.dark'
  }
};

export default theme;
