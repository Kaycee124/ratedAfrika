import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1728815817371 implements MigrationInterface {
    name = 'Migration1728815817371'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6c50e3a3bee2912c1153c63aa6"`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" RENAME COLUMN "token" TO "resetCode"`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" RENAME CONSTRAINT "UQ_6c50e3a3bee2912c1153c63aa64" TO "UQ_14072de87e238e9c6700ccb82d7"`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" DROP CONSTRAINT "UQ_14072de87e238e9c6700ccb82d7"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_token" ADD CONSTRAINT "UQ_14072de87e238e9c6700ccb82d7" UNIQUE ("resetCode")`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" RENAME CONSTRAINT "UQ_14072de87e238e9c6700ccb82d7" TO "UQ_6c50e3a3bee2912c1153c63aa64"`);
        await queryRunner.query(`ALTER TABLE "password_reset_token" RENAME COLUMN "resetCode" TO "token"`);
        await queryRunner.query(`CREATE INDEX "IDX_6c50e3a3bee2912c1153c63aa6" ON "password_reset_token" ("token") `);
    }

}
