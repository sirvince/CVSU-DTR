import { MigrationInterface, QueryRunner } from 'typeorm';

// Converts academic_periods from a per-teacher-owned table to a shared,
// admin-managed resource (see CLAUDE.md's Deployment/architecture notes).
// teacher_id -> created_by_user_id is a straight CHANGE (rename + relax to
// nullable) in one statement, not a drop-and-recreate, specifically to
// preserve the existing column's data — TypeORM's auto-generated version of
// this migration did drop-and-recreate and would have silently NULLed out
// the one real row already in production. No de-duplication step: checked
// production directly before writing this (see CLAUDE.md) and there are
// zero duplicate (academic_year, semester) pairs as of 2026-08-20 — if this
// runs later against a database that *does* have duplicates, the new
// UNIQUE index will fail and those rows need manual de-duplication first.
export class AcademicPeriodsSharedResource1787211150990 implements MigrationInterface {
  name = 'AcademicPeriodsSharedResource1787211150990';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_0dbdcb9379d0c48c05b755a959\` ON \`academic_periods\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`academic_periods\` CHANGE \`teacher_id\` \`created_by_user_id\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_e739cc431254ccf12491f10c2b\` ON \`academic_periods\` (\`academic_year\`, \`semester\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_e739cc431254ccf12491f10c2b\` ON \`academic_periods\``,
    );
    // Best-effort: fails if any row's created_by_user_id is NULL (e.g. one
    // created by an admin after this migration ran) — reverting shared
    // periods back to strictly-per-teacher-owned isn't a clean operation in
    // general, so this is only expected to work on a rollback attempted
    // immediately after the up() migration, before real admin-created data
    // exists.
    await queryRunner.query(
      `ALTER TABLE \`academic_periods\` CHANGE \`created_by_user_id\` \`teacher_id\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_0dbdcb9379d0c48c05b755a959\` ON \`academic_periods\` (\`teacher_id\`, \`academic_year\`, \`semester\`)`,
    );
  }
}
