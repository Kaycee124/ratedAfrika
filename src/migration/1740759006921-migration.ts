import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740759006921 implements MigrationInterface {
    name = 'Migration1740759006921'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "split_sheets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "songId" uuid, CONSTRAINT "PK_808a497d6ebf2107160dc14b965" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "split_sheet_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "splitSheetId" uuid NOT NULL, "userId" uuid, "recipientEmail" character varying NOT NULL, "claimToken" character varying NOT NULL, "percentage" numeric(5,2) NOT NULL, "status" "public"."split_sheet_entries_status_enum" NOT NULL DEFAULT 'Pending', CONSTRAINT "UQ_13e9bada243e8e983e9d6f10ab2" UNIQUE ("claimToken"), CONSTRAINT "PK_d4d1d86bcb47a6680dd15204a88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "split_sheets" ADD CONSTRAINT "FK_6fd198aec672ad50d8b4d1d6eab" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ADD CONSTRAINT "FK_b416c09d151e75d358488f5489e" FOREIGN KEY ("splitSheetId") REFERENCES "split_sheets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" ADD CONSTRAINT "FK_38c0308e21c6f2037372ec4b41e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" DROP CONSTRAINT "FK_38c0308e21c6f2037372ec4b41e"`);
        await queryRunner.query(`ALTER TABLE "split_sheet_entries" DROP CONSTRAINT "FK_b416c09d151e75d358488f5489e"`);
        await queryRunner.query(`ALTER TABLE "split_sheets" DROP CONSTRAINT "FK_6fd198aec672ad50d8b4d1d6eab"`);
        await queryRunner.query(`DROP TABLE "split_sheet_entries"`);
        await queryRunner.query(`DROP TABLE "split_sheets"`);
    }

}
