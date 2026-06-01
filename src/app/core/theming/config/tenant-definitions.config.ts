import { ClientConfig } from '../theming.types';

export const defaultTenantConfig: ClientConfig = {
  key: 'default',
  theme: 'default'
};

export const tenantDefinitions: Record<string, ClientConfig> = {
  default: defaultTenantConfig,
  tenant1: {
    key: 'tenant1',
    theme: 'tenant1'
  }
};
