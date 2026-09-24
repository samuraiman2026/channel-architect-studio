import { Migration } from '@mikro-orm/migrations';

export class Migration20260924144424_channel_architect extends Migration {

  override up(): void | Promise<void> {
    this.addSql(`create table "channel_architect_pilots" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "program_version_id" uuid not null, "name" text not null, "cohort_label" text not null, "owner_user_id" text not null, "status" text not null default 'planned', "target_start_date" date not null, "target_end_date" date null, "outcome" text null, "created_by" text not null, "is_active" boolean not null default true, "deleted_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "channel_architect_pilot_version_idx" on "channel_architect_pilots" ("program_version_id");`);
    this.addSql(`create index "channel_architect_pilot_scope_idx" on "channel_architect_pilots" ("tenant_id", "organization_id", "updated_at");`);

    this.addSql(`create table "channel_architect_pilot_checkpoints" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "pilot_id" uuid not null, "sort_order" int not null, "title" text not null, "due_date" date not null, "status" text not null default 'planned', "completed_at" timestamptz null, "is_active" boolean not null default true, "deleted_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "channel_architect_checkpoint_scope_idx" on "channel_architect_pilot_checkpoints" ("tenant_id", "organization_id", "pilot_id");`);
    this.addSql(`alter table "channel_architect_pilot_checkpoints" add constraint "channel_architect_checkpoint_order_uq" unique ("pilot_id", "sort_order");`);

    this.addSql(`create table "channel_architect_programs" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "name" text not null, "owner_user_id" text not null, "status" text not null default 'draft', "current_version_number" int not null default 0, "is_active" boolean not null default true, "deleted_at" timestamptz null, "created_by" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`);
    this.addSql(`create index "channel_architect_program_scope_idx" on "channel_architect_programs" ("tenant_id", "organization_id", "updated_at");`);

    this.addSql(`create table "channel_architect_program_reviews" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "program_version_id" uuid not null, "decision" text not null, "reviewer_user_id" text not null, "rationale" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "is_active" boolean not null default true, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`create index "channel_architect_review_scope_idx" on "channel_architect_program_reviews" ("tenant_id", "organization_id", "program_version_id");`);
    this.addSql(`alter table "channel_architect_program_reviews" add constraint "channel_architect_program_review_version_uq" unique ("program_version_id");`);

    this.addSql(`create table "channel_architect_program_versions" ("id" uuid not null default gen_random_uuid(), "tenant_id" uuid not null, "organization_id" uuid not null, "program_id" uuid not null, "version_number" int not null, "scenario_snapshot" jsonb not null, "settings_snapshot" jsonb not null, "output_snapshot" jsonb not null, "engine_version" text not null, "created_by" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "is_active" boolean not null default true, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`create index "channel_architect_version_scope_idx" on "channel_architect_program_versions" ("tenant_id", "organization_id", "program_id");`);
    this.addSql(`alter table "channel_architect_program_versions" add constraint "channel_architect_program_version_number_uq" unique ("program_id", "version_number");`);
  }

}
