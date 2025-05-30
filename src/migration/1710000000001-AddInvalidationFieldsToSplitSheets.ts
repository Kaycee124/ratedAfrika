import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvalidationFieldsToSplitSheets1710000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new status value to split_sheet_entries_status_enum
    await queryRunner.query(`
            ALTER TYPE "split_sheet_entries_status_enum" 
            ADD VALUE 'Invalidated';
        `);

    // Add invalidation tracking fields to split_sheet_entries
    await queryRunner.query(`
            ALTER TABLE "split_sheet_entries"
            ADD COLUMN "invalidatedAt" TIMESTAMP,
            ADD COLUMN "invalidatedBy" character varying,
            ADD COLUMN "invalidationReason" character varying;
        `);

    // Create splitsheet status enum
    await queryRunner.query(`
            CREATE TYPE "split_sheets_status_enum" AS ENUM ('Active', 'PaidOut', 'Archived');
        `);

    // Add status and tracking fields to split_sheets
    await queryRunner.query(`
            ALTER TABLE "split_sheets"
            ADD COLUMN "status" "split_sheets_status_enum" NOT NULL DEFAULT 'Active',
            ADD COLUMN "paidOutAt" TIMESTAMP,
            ADD COLUMN "lastModifiedBy" character varying;
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
