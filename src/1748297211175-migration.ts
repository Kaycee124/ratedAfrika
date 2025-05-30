import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1748297211175 implements MigrationInterface {
    name = 'Migration1748297211175'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."split_sheets_status_enum" AS ENUM('Active', 'PaidOut', 'Archived')`);
        await queryRunner.query(`ALTER TABLE "split_sheets" ADD "status" "public"."split_sheets_status_enum" NOT NULL DEFAULT 'Active'`);
        await queryRunner.query(`ALTER TABLE "split_sheets" ADD "paidOutAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "split_sheets" ADD "lastModifiedBy" character varying`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ADD "invalidatedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TYPE "public"."split_sheet_entries_status_enum" RENAME TO "split_sheet_entries_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."split_sheet_entries_status_enum" AS ENUM('Pending', 'Active', 'Paid', 'Invalidated')`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ALTER COLUMN "status" TYPE "public"."split_sheet_entries_status_enum" USING "status"::"text"::"public"."split_sheet_entries_status_enum"`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ALTER COLUMN "status" SET DEFAULT 'Pending'`);
        await queryRunner.query(`DROP TYPE "public"."split_sheet_entries_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."split_sheet_entries_status_enum_old" AS ENUM('Pending', 'Active', 'Paid')`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ALTER COLUMN "status" TYPE "public"."split_sheet_entries_status_enum_old" USING "status"::"text"::"public"."split_sheet_entries_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ALTER COLUMN "status" SET DEFAULT 'Pending'`);
        await queryRunner.query(`DROP TYPE "public"."split_sheet_entries_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."split_sheet_entries_status_enum_old" RENAME TO "split_sheet_entries_status_enum"`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" DROP COLUMN "invalidatedAt"`);
        await queryRunner.query(`ALTER TABLE "split_sheets" DROP COLUMN "lastModifiedBy"`);
        await queryRunner.query(`ALTER TABLE "split_sheets" DROP COLUMN "paidOutAt"`);
        await queryRunner.query(`ALTER TABLE "split_sheets" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."split_sheets_status_enum"`);
    }

}
