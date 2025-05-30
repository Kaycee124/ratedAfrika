import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecipientNameToSplitSheetEntry1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "split_sheet_entries"
            ADD COLUMN "recipientName" character varying;
        `);

        // Update existing entries to use email username as recipient name
        await queryRunner.query(`
            UPDATE "split_sheet_entries"
            SET "recipientName" = SPLIT_PART("recipientEmail", '@', 1)
            WHERE "recipientName" IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "split_sheet_entries"
            DROP COLUMN "recipientName";
        `);
    }
} 