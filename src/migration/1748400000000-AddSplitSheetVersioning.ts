import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSplitSheetVersioning1748400000000
  implements MigrationInterface
{
  name = 'AddSplitSheetVersioning1748400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Add versioning columns to split_sheets if they are missing
    await queryRunner.query(`
      ALTER TABLE "split_sheets"
      ADD COLUMN IF NOT EXISTS "previousVersionId" uuid;
    `);
    await queryRunner.query(`
      ALTER TABLE "split_sheets"
      ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
    `);
    await queryRunner.query(`
      ALTER TABLE "split_sheets"
      ADD COLUMN IF NOT EXISTS "replacedAt" TIMESTAMP;
    `);
    await queryRunner.query(`
      ALTER TABLE "split_sheets" 
      ADD COLUMN IF NOT EXISTS "replacedBy" character varying;
    `);

    // 2) Add currentSplitSheetId to songs if missing
    await queryRunner.query(`
      ALTER TABLE "songs" 
      ADD COLUMN IF NOT EXISTS "currentSplitSheetId" uuid;
    `);

    // 3) Add foreign key constraint only if it doesn't already exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_songs_currentSplitSheetId'
        ) THEN
      ALTER TABLE "songs" 
      ADD CONSTRAINT "FK_songs_currentSplitSheetId" 
      FOREIGN KEY ("currentSplitSheetId") 
      REFERENCES "split_sheets"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);

    // Populate currentSplitSheetId for existing songs with active split sheets
    await queryRunner.query(`
      UPDATE "songs" 
      SET "currentSplitSheetId" = (
        SELECT ss.id 
        FROM "split_sheets" ss 
        WHERE ss."songId" = "songs".id 
        AND ss.status = 'Active'
        LIMIT 1
      )
      WHERE EXISTS (
        SELECT 1 
        FROM "split_sheets" ss 
        WHERE ss."songId" = "songs".id 
        AND ss.status = 'Active'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint if it exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_songs_currentSplitSheetId'
        ) THEN
          ALTER TABLE "songs" DROP CONSTRAINT "FK_songs_currentSplitSheetId";
        END IF;
      END$$;
    `);

    // Remove currentSplitSheetId column
    await queryRunner.query(`
      ALTER TABLE "songs" DROP COLUMN IF EXISTS "currentSplitSheetId";
    `);

    // Remove versioning columns from split_sheets
    await queryRunner.query(`
      ALTER TABLE "split_sheets" 
      DROP COLUMN IF EXISTS "previousVersionId",
      DROP COLUMN IF EXISTS "version",
      DROP COLUMN IF EXISTS "replacedAt",
      DROP COLUMN IF EXISTS "replacedBy";
    `);
  }
}
