import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1750140258275 implements MigrationInterface {
    name = 'Migration1750140258275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "songs" DROP CONSTRAINT "FK_songs_currentSplitSheetId"`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" DROP COLUMN "invalidatedBy"`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" DROP COLUMN "invalidationReason"`);
        await queryRunner.query(`ALTER TABLE "songs" ADD CONSTRAINT "FK_5789c0783b7d8fff2eda1e2b1a5" FOREIGN KEY ("currentSplitSheetId") REFERENCES "split_sheets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "songs" DROP CONSTRAINT "FK_5789c0783b7d8fff2eda1e2b1a5"`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ADD "invalidationReason" character varying`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ADD "invalidatedBy" character varying`);
        await queryRunner.query(`ALTER TABLE "songs" ADD CONSTRAINT "FK_songs_currentSplitSheetId" FOREIGN KEY ("currentSplitSheetId") REFERENCES "split_sheets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
