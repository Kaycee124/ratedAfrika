import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvalidationFieldsToSplitSheets1710000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Safely add enum value 'Invalidated' if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'split_sheet_entries_status_enum'
            AND e.enumlabel = 'Invalidated'
        ) THEN
          ALTER TYPE "split_sheet_entries_status_enum" ADD VALUE 'Invalidated';
        END IF;
      END$$;
        `);

    // 2) Add new columns to split_sheet_entries if they are missing
    await queryRunner.query(`
            ALTER TABLE "split_sheet_entries"
      ADD COLUMN IF NOT EXISTS "invalidatedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "invalidatedBy" character varying,
      ADD COLUMN IF NOT EXISTS "invalidationReason" character varying;
        `);

    // 3) Create splitsheet status enum only if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'split_sheets_status_enum'
        ) THEN
            CREATE TYPE "split_sheets_status_enum" AS ENUM ('Active', 'PaidOut', 'Archived');
        END IF;
      END$$;
        `);

    // 4) Add columns to split_sheets table if they are missing
    await queryRunner.query(`
            ALTER TABLE "split_sheets"
      ADD COLUMN IF NOT EXISTS "status" "split_sheets_status_enum" NOT NULL DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS "paidOutAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "lastModifiedBy" character varying;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove fields from split_sheets
    await queryRunner.query(`
            ALTER TABLE "split_sheets"
            DROP COLUMN "status",
            DROP COLUMN "paidOutAt",
            DROP COLUMN "lastModifiedBy";
        `);

    // Drop splitsheet status enum
    await queryRunner.query(`
            DROP TYPE "split_sheets_status_enum";
        `);

    // Remove invalidation fields from split_sheet_entries
    await queryRunner.query(`
            ALTER TABLE "split_sheet_entries"
            DROP COLUMN "invalidatedAt",
            DROP COLUMN "invalidatedBy", 
            DROP COLUMN "invalidationReason";
        `);

    // Note: Cannot remove enum value in PostgreSQL, would need to recreate enum
    // This is a limitation of PostgreSQL migrations
  }
}
