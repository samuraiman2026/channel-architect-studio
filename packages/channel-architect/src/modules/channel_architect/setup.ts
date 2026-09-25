import type { ModuleSetupConfig } from "@open-mercato/shared/modules/setup";

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    superadmin: [
      "channel_architect.programs.view",
      "channel_architect.programs.manage",
      "channel_architect.programs.approve",
      "channel_architect.pilots.view",
      "channel_architect.pilots.manage",
    ],
    admin: [
      "channel_architect.programs.view",
      "channel_architect.programs.manage",
      "channel_architect.programs.approve",
      "channel_architect.pilots.view",
      "channel_architect.pilots.manage",
    ],
    employee: ["channel_architect.programs.view", "channel_architect.pilots.view"],
  },
};

export default setup;
