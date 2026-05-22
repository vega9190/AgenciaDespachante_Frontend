import { ClientConfig } from '../theming.types';

export const defaultTenantConfig: ClientConfig = {
  key: 'default',
  loginTitle: 'Frontend Seed',
  loginSubTitle: 'PrimeNG starter',
  siteTitle: 'Frontend Seed',
  theme: 'default',
  assetsConfig: {
    favicon: 'favicon.svg',
    logo: 'logo.svg',
    styleSheet: 'styles.css'
  }
};

export const tenantDefinitions: Record<string, ClientConfig> = {
  default: defaultTenantConfig
};
