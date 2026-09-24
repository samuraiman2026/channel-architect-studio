import { OptionalProps } from '@mikro-orm/core'
import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy'
import type { AxisSettings, Scenario, Sections } from '../lib/types'

@Entity({ tableName: 'channel_architect_programs' })
@Index({ name: 'channel_architect_program_scope_idx', properties: ['tenantId', 'organizationId', 'updatedAt'] })
export class ChannelArchitectProgram {
  [OptionalProps]?: 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'name', type: 'text' })
  name!: string

  @Property({ name: 'owner_user_id', type: 'text' })
  ownerUserId!: string

  @Property({ name: 'status', type: 'text', default: 'draft' })
  status: 'draft' | 'active' | 'archived' = 'draft'

  @Property({ name: 'current_version_number', type: 'integer', default: 0 })
  currentVersionNumber = 0

  @Property({ name: 'created_by', type: 'text' })
  createdBy!: string

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}

@Entity({ tableName: 'channel_architect_program_versions' })
@Index({ name: 'channel_architect_version_scope_idx', properties: ['tenantId', 'organizationId', 'programId'] })
@Unique({ name: 'channel_architect_program_version_number_uq', properties: ['programId', 'versionNumber'] })
export class ChannelArchitectProgramVersion {
  [OptionalProps]?: 'createdAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'program_id', type: 'uuid' })
  programId!: string

  @Property({ name: 'version_number', type: 'integer' })
  versionNumber!: number

  @Property({ name: 'scenario_snapshot', type: 'jsonb' })
  scenarioSnapshot!: Scenario

  @Property({ name: 'settings_snapshot', type: 'jsonb' })
  settingsSnapshot!: AxisSettings

  @Property({ name: 'output_snapshot', type: 'jsonb' })
  outputSnapshot!: Sections

  @Property({ name: 'engine_version', type: 'text' })
  engineVersion!: string

  @Property({ name: 'created_by', type: 'text' })
  createdBy!: string

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()
}

@Entity({ tableName: 'channel_architect_program_reviews' })
@Index({ name: 'channel_architect_review_scope_idx', properties: ['tenantId', 'organizationId', 'programVersionId'] })
@Unique({ name: 'channel_architect_program_review_version_uq', properties: ['programVersionId'] })
export class ChannelArchitectProgramReview {
  [OptionalProps]?: 'createdAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'program_version_id', type: 'uuid' })
  programVersionId!: string

  @Property({ name: 'decision', type: 'text' })
  decision!: 'approved' | 'rejected'

  @Property({ name: 'reviewer_user_id', type: 'text' })
  reviewerUserId!: string

  @Property({ name: 'rationale', type: 'text' })
  rationale!: string

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()
}

@Entity({ tableName: 'channel_architect_pilots' })
@Index({ name: 'channel_architect_pilot_scope_idx', properties: ['tenantId', 'organizationId', 'updatedAt'] })
@Index({ name: 'channel_architect_pilot_version_idx', properties: ['programVersionId'] })
export class ChannelArchitectPilot {
  [OptionalProps]?: 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'program_version_id', type: 'uuid' })
  programVersionId!: string

  @Property({ name: 'name', type: 'text' })
  name!: string

  @Property({ name: 'cohort_label', type: 'text' })
  cohortLabel!: string

  @Property({ name: 'owner_user_id', type: 'text' })
  ownerUserId!: string

  @Property({ name: 'status', type: 'text', default: 'planned' })
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled' = 'planned'

  @Property({ name: 'target_start_date', type: 'date' })
  targetStartDate!: Date

  @Property({ name: 'target_end_date', type: 'date', nullable: true })
  targetEndDate: Date | null = null

  @Property({ name: 'outcome', type: 'text', nullable: true })
  outcome: 'continue' | 'revise' | 'stop' | null = null

  @Property({ name: 'created_by', type: 'text' })
  createdBy!: string

  @Property({ name: 'is_active', type: 'boolean', default: true })
  isActive = true

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt: Date | null = null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}

@Entity({ tableName: 'channel_architect_pilot_checkpoints' })
@Index({ name: 'channel_architect_checkpoint_scope_idx', properties: ['tenantId', 'organizationId', 'pilotId'] })
@Unique({ name: 'channel_architect_checkpoint_order_uq', properties: ['pilotId', 'sortOrder'] })
export class ChannelArchitectPilotCheckpoint {
  [OptionalProps]?: 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'pilot_id', type: 'uuid' })
  pilotId!: string

  @Property({ name: 'sort_order', type: 'integer' })
  sortOrder!: number

  @Property({ name: 'title', type: 'text' })
  title!: string

  @Property({ name: 'due_date', type: 'date' })
  dueDate!: Date

  @Property({ name: 'status', type: 'text', default: 'planned' })
  status: 'planned' | 'completed' | 'skipped' = 'planned'

  @Property({ name: 'completed_at', type: Date, nullable: true })
  completedAt: Date | null = null

  @Property({ name: 'is_active', type: 'boolean', default: true })
  isActive = true

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt: Date | null = null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}
