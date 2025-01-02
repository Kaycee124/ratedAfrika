import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1734468487772 implements MigrationInterface {
    name = 'Migration1734468487772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "spotify_id" character varying`);
        await queryRunner.query(`ALTER TABLE "collaborators" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ADD "isLocked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ADD "isVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ADD "verifiedBy" character varying`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ADD "verifiedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TYPE "public"."collaborators_type_enum" RENAME TO "collaborators_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."collaborators_type_enum" AS ENUM('artist', 'producer', 'writer', 'performer', 'engineer', 'arranger')`);
        await queryRunner.query(`ALTER TABLE "collaborators" ALTER COLUMN "type" TYPE "public"."collaborators_type_enum" USING "type"::"text"::"public"."collaborators_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."collaborators_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" DROP CONSTRAINT "FK_4a2f3ed56e9ab705de563485d74"`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ALTER COLUMN "collaboratorId" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."collaborator_splits_splittype_enum" RENAME TO "collaborator_splits_splittype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."collaborator_splits_splittype_enum" AS ENUM('publishing', 'master', 'performance', 'sync', 'writing', 'production', 'arrangement', 'recording')`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ALTER COLUMN "splitType" TYPE "public"."collaborator_splits_splittype_enum" USING "splitType"::"text"::"public"."collaborator_splits_splittype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."collaborator_splits_splittype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ADD CONSTRAINT "FK_4a2f3ed56e9ab705de563485d74" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collaborator_splits" DROP CONSTRAINT "FK_4a2f3ed56e9ab705de563485d74"`);
        await queryRunner.query(`CREATE TYPE "public"."collaborator_splits_splittype_enum_old" AS ENUM('WRITING', 'PERFORMANCE', 'PRODUCTION', 'PUBLISHING')`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ALTER COLUMN "splitType" TYPE "public"."collaborator_splits_splittype_enum_old" USING "splitType"::"text"::"public"."collaborator_splits_splittype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."collaborator_splits_splittype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."collaborator_splits_splittype_enum_old" RENAME TO "collaborator_splits_splittype_enum"`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ALTER COLUMN "collaboratorId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" ADD CONSTRAINT "FK_4a2f3ed56e9ab705de563485d74" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TYPE "public"."collaborators_type_enum_old" AS ENUM('ARTIST', 'WRITER', 'PRODUCER', 'EXTERNAL', 'LABEL_ARTIST')`);
        await queryRunner.query(`ALTER TABLE "collaborators" ALTER COLUMN "type" TYPE "public"."collaborators_type_enum_old" USING "type"::"text"::"public"."collaborators_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."collaborators_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."collaborators_type_enum_old" RENAME TO "collaborators_type_enum"`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" DROP COLUMN "verifiedAt"`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" DROP COLUMN "verifiedBy"`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" DROP COLUMN "isVerified"`);
        await queryRunner.query(`ALTER TABLE "collaborator_splits" DROP COLUMN "isLocked"`);
        await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "spotify_id"`);
    }

}
