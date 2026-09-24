import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    superadmin: ['channel_architect.programs.view', 'channel_architect.programs.manage', 'channel_architect.programs.approve'],
    admin: ['channel_architect.programs.view', 'channel_architect.programs.manage', 'channel_architect.programs.approve'],
    employee: ['channel_architect.programs.view'],
  },
}

export default setup
