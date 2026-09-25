import { z } from "zod";

const economicsSchema = z
  .object({
    resell: z.number().int().min(0).max(100),
    refer: z.number().int().min(0).max(100),
    influence: z.number().int().min(0).max(100),
    buildOn: z.number().int().min(0).max(100),
  })
  .refine((value) => Object.values(value).reduce((sum, item) => sum + item, 0) === 100, {
    message: "Planning emphasis must total 100%.",
  });

const archetype = z.enum([
  "SI / Consulting",
  "ISV",
  "VAR",
  "MSP",
  "Referral / Agency",
  "Marketplace",
]);
const stage = z.enum([
  "Pre-PMF",
  "Early Scale ($1-10M ARR)",
  "Scaling ($10-50M ARR)",
  "Mature ($50M+ ARR)",
]);

export const scenarioSchema = z.object({
  id: z.enum(["ai-infra-b", "vertical-ai-a", "ai-devtools-c", "custom"]),
  label: z.string().trim().min(1).max(240),
  arr: z.string().max(240),
  motion: z.string().max(240),
  icp: z.string().trim().min(1).max(240),
  ask: z.string().trim().min(1).max(240),
  defaults: z.object({
    economics: economicsSchema,
    primaryArchetypes: z.array(archetype).min(1),
    secondaryArchetypes: z.array(archetype),
    stage,
  }),
});

export const axisSettingsSchema = z.object({
  economics: economicsSchema,
  primaryArchetypes: z.array(archetype).min(1),
  secondaryArchetypes: z.array(archetype),
  stage,
});

export const programCreateSchema = z.object({
  name: z.string().trim().min(1).max(240),
  scenario: scenarioSchema,
  settings: axisSettingsSchema,
});

export const programRevisionSchema = z.object({
  expectedVersion: z.number().int().positive(),
  scenario: scenarioSchema,
  settings: axisSettingsSchema,
});

export const programArchiveSchema = z.object({
  expectedVersion: z.number().int().positive(),
});

export const programReviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  rationale: z.string().trim().min(1).max(8000),
});

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a real calendar date.");

export const pilotCreateSchema = z
  .object({
    programVersionId: z.string().uuid(),
    name: z.string().trim().min(1).max(160),
    cohortLabel: z.string().trim().min(1).max(240),
    targetStartDate: isoDateSchema,
    targetEndDate: isoDateSchema.nullable().optional(),
    checkpoints: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(160),
          dueDate: isoDateSchema,
        }),
      )
      .min(1)
      .max(30),
  })
  .superRefine((value, context) => {
    const targetEnd = value.targetEndDate ?? null;
    if (targetEnd && targetEnd < value.targetStartDate) {
      context.addIssue({
        code: "custom",
        path: ["targetEndDate"],
        message: "End date must be on or after the start date.",
      });
    }
    value.checkpoints.forEach((checkpoint, index) => {
      if (
        checkpoint.dueDate < value.targetStartDate ||
        (targetEnd && checkpoint.dueDate > targetEnd)
      ) {
        context.addIssue({
          code: "custom",
          path: ["checkpoints", index, "dueDate"],
          message: "Checkpoint date must fall within the pilot date range.",
        });
      }
    });
  });

export const pilotStatusUpdateSchema = z
  .object({
    status: z.enum(["active", "paused", "completed", "cancelled"]),
    outcome: z.enum(["continue", "revise", "stop"]).optional(),
  })
  .superRefine((value, context) => {
    if (value.status === "completed" && !value.outcome) {
      context.addIssue({
        code: "custom",
        path: ["outcome"],
        message: "Choose continue, revise, or stop when completing a pilot.",
      });
    }
    if (value.status !== "completed" && value.outcome) {
      context.addIssue({
        code: "custom",
        path: ["outcome"],
        message: "An outcome is only recorded when the pilot is completed.",
      });
    }
  });

export const pilotCheckpointUpdateSchema = z.object({
  status: z.enum(["completed", "skipped"]),
});
