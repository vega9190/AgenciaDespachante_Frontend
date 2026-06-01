import { defaultTenantConfig, tenantDefinitions } from './tenant-definitions.config';
import { ClientConfig } from '../theming.types';

export function resolveTenantConfig(hostname: string): ClientConfig {
  const normalizedHostname = hostname.toLowerCase();

  if (normalizedHostname === 'localhost' || normalizedHostname === '127.0.0.1') {
    return tenantDefinitions.default ?? defaultTenantConfig;
  }

  if (normalizedHostname === 'tenant1.localhost' || normalizedHostname.startsWith('tenant1.')) {
    return tenantDefinitions.tenant1 ?? defaultTenantConfig;
  }

  return tenantDefinitions.default ?? defaultTenantConfig;
}
