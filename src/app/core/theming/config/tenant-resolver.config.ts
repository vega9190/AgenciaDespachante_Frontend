import { defaultTenantConfig, tenantDefinitions } from './tenant-definitions.config';
import { ClientConfig } from '../theming.types';

export function resolveTenantConfig(_hostname: string): ClientConfig {
  return tenantDefinitions.default ?? defaultTenantConfig;
}
