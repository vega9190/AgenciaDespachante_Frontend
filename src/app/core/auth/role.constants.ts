export const RoleIds = {
  Administrator: '23FCE64B-B6F6-4C67-B2C4-5F0E63B5E1A1',
  Manager: 'F1C6F2E1-5A09-43B9-BEB2-AEAFD267D3F3',
  Client: 'A0D0CBB7-FB90-427E-A4C7-52D79B828C21'
} as const;

export const ROLE_HOME_ROUTE: Record<string, string> = {
  [RoleIds.Administrator]: '/dashboard',
  [RoleIds.Manager]: '/imports',
  [RoleIds.Client]: '/imports'
};
