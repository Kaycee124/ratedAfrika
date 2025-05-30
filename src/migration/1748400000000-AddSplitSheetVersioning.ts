import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSplitSheetVersioning1748400000000
  implements MigrationInterface
{
  name = 'AddSplitSheetVersioning1748400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add versioning fields to split_sheets table
    await queryRunner.query(`
      ALTER TABLE "split_sheets" 
      ADD COLUMN "previousVersionId" uuid,
      ADD COLUMN "version" integer NOT NULL DEFAULT 1,
      ADD COLUMN "replacedAt" TIMESTAMP,
      ADD COLUMN "replacedBy" character varying;
    `);

    // Add current splitsheet reference to songs table
    await queryRunner.query(`
      ALTER TABLE "songs" 
      ADD COLUMN "currentSplitSheetId" uuid;
    `);

    // Add foreign key constraint for songs.currentSplitSheetId
    await queryRunner.query(`
      ALTER TABLE "songs" 
      ADD CONSTRAINT "FK_songs_currentSplitSheetId" 
      FOREIGN KEY ("currentSplitSheetId") 
      REFERENCES "split_sheets"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION;
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
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "songs" 
      DROP CONSTRAINT "FK_songs_currentSplitSheetId";
    `);

    // Remove currentSplitSheetId from songs
    await queryRunner.query(`
      ALTER TABLE "songs" 
      DROP COLUMN "currentSplitSheetId";
    `);

    // Remove versioning fields from split_sheets
    await queryRunner.query(`
      ALTER TABLE "split_sheets" 
      DROP COLUMN "previousVersionId",
      DROP COLUMN "version",
      DROP COLUMN "replacedAt",
      DROP COLUMN "replacedBy";
    `);
  }
}
