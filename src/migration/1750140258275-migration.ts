import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1750140258275 implements MigrationInterface {
  name = 'Migration1750140258275';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Drop old FK if it exists
    await queryRunner.query(
      `ALTER TABLE "songs" DROP CONSTRAINT IF EXISTS "FK_songs_currentSplitSheetId";`,
    );

    // 2) Safely drop columns if they exist
    await queryRunner.query(
      `ALTER TABLE "split_sheet_entries" DROP COLUMN IF EXISTS "invalidatedBy";`,
    );
    await queryRunner.query(
      `ALTER TABLE "split_sheet_entries" DROP COLUMN IF EXISTS "invalidationReason";`,
    );

    // 3) Add replacement FK only if it does not already exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_5789c0783b7d8fff2eda1e2b1a5'
        ) THEN
          ALTER TABLE "songs"
          ADD CONSTRAINT "FK_5789c0783b7d8fff2eda1e2b1a5"
          FOREIGN KEY ("currentSplitSheetId")
          REFERENCES "split_sheets"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: drop new FK if exists
    await queryRunner.query(
      `ALTER TABLE "songs" DROP CONSTRAINT IF EXISTS "FK_5789c0783b7d8fff2eda1e2b1a5";`,
    );

    // Re-add columns only if missing
    await queryRunner.query(
      `ALTER TABLE "split_sheet_entries" ADD COLUMN IF NOT EXISTS "invalidationReason" character varying;`,
    );
    await queryRunner.query(
      `ALTER TABLE "split_sheet_entries" ADD COLUMN IF NOT EXISTS "invalidatedBy" character varying;`,
    );

    // Recreate original FK only if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_songs_currentSplitSheetId'
        ) THEN
          ALTER TABLE "songs"
          ADD CONSTRAINT "FK_songs_currentSplitSheetId"
          FOREIGN KEY ("currentSplitSheetId")
          REFERENCES "split_sheets"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  }
}
