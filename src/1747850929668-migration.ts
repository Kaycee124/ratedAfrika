import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1747850929668 implements MigrationInterface {
    name = 'Migration1747850929668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ADD "recipientName" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" DROP COLUMN "recipientName"`);
    }

}
