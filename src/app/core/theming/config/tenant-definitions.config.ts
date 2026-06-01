import { ClientConfig } from '../theming.types';

export const defaultTenantConfig: ClientConfig = {
  key: 'default',
  loginTitle: 'Transportadora',
  loginSubTitle: '',
  siteTitle: 'Transportadora',
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
