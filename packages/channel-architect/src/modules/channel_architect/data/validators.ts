import { z } from 'zod'

const economicsSchema = z.object({
  resell: z.number().int().min(0).max(100),
  refer: z.number().int().min(0).max(100),
  influence: z.number().int().min(0).max(100),
  buildOn: z.number().int().min(0).max(100),
}).refine((value) => Object.values(value).reduce((sum, item) => sum + item, 0) === 100, {
  message: 'Planning emphasis must total 100%.',
})

const archetype = z.enum(['SI / Consulting', 'ISV', 'VAR', 'MSP', 'Referral / Agency', 'Marketplace'])
const stage = z.enum(['Pre-PMF', 'Early Scale ($1-10M ARR)', 'Scaling ($10-50M ARR)', 'Mature ($50M+ ARR)'])

export const scenarioSchema = z.object({
  id: z.enum(['ai-infra-b', 'vertical-ai-a', 'ai-devtools-c', 'custom']),
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
})

export const axisSettingsSchema = z.object({
  economics: economicsSchema,
  primaryArchetypes: z.array(archetype).min(1),
  secondaryArchetypes: z.array(archetype),
  stage,
})

export const programCreateSchema = z.object({
  name: z.string().trim().min(1).max(240),
  scenario: scenarioSchema,
  settings: axisSettingsSchema,
})

export const programRevisionSchema = z.object({
  expectedVersion: z.number().int().positive(),
  scenario: scenarioSchema,
  settings: axisSettingsSchema,
})

export const programReviewSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rationale: z.string().trim().min(1).max(8000),
})
