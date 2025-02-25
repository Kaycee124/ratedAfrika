import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739880663548 implements MigrationInterface {
    name = 'Migration1739880663548'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "hasPublishedMusic"`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "spotifyUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "appleUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "youtubeUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "createdByUserId" uuid`);
        await queryRunner.query(`ALTER TABLE "temp_artists" ADD "isTemp" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD CONSTRAINT "FK_4c40b1058f7e2b07e2e8b5dc4a2" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborators" DROP CONSTRAINT "FK_4c40b1058f7e2b07e2e8b5dc4a2"`);
        await queryRunner.query(`ALTER TABLE "temp_artists" DROP COLUMN "isTemp"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "createdByUserId"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "youtubeUrl"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "appleUrl"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "spotifyUrl"`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "hasPublishedMusic" boolean NOT NULL DEFAULT false`);
    }

}
