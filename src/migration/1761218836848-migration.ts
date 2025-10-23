import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1761218836848 implements MigrationInterface {
    name = 'Migration1761218836848'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Clear the table before restructuring to avoid NOT NULL constraint violations
        await queryRunner.query(`TRUNCATE TABLE "song_collaborators" CASCADE`);
        
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP CONSTRAINT "FK_aa0031d1f1aae796e950d771da0"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP CONSTRAINT "PK_18218bdc4fd42b5ebdf7d509951"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "songId"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "collaboratorId"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."song_collaborators_role_enum"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "splitPercentage"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "song_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD CONSTRAINT "PK_8ad69d89a9ee6ad50f75c1dae59" PRIMARY KEY ("song_id")`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "collaborator_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP CONSTRAINT "PK_8ad69d89a9ee6ad50f75c1dae59"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD CONSTRAINT "PK_dd105deb43c0505b9e6984d5ad4" PRIMARY KEY ("song_id", "collaborator_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_8ad69d89a9ee6ad50f75c1dae5" ON "song_collaborators" ("song_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_dc5253fe5e4f3e1645fe2a54e0" ON "song_collaborators" ("collaborator_id") `);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD CONSTRAINT "FK_8ad69d89a9ee6ad50f75c1dae59" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD CONSTRAINT "FK_dc5253fe5e4f3e1645fe2a54e01" FOREIGN KEY ("collaborator_id") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP CONSTRAINT "FK_dc5253fe5e4f3e1645fe2a54e01"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP CONSTRAINT "FK_8ad69d89a9ee6ad50f75c1dae59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc5253fe5e4f3e1645fe2a54e0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ad69d89a9ee6ad50f75c1dae5"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP CONSTRAINT "PK_dd105deb43c0505b9e6984d5ad4"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD CONSTRAINT "PK_8ad69d89a9ee6ad50f75c1dae59" PRIMARY KEY ("song_id")`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "collaborator_id"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP CONSTRAINT "PK_8ad69d89a9ee6ad50f75c1dae59"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" DROP COLUMN "song_id"`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "deletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "splitPercentage" numeric(5,2) NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."song_collaborators_role_enum" AS ENUM('featured', 'm&m', 'producer', 'writer')`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "role" "public"."song_collaborators_role_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "collaboratorId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "songId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD CONSTRAINT "PK_18218bdc4fd42b5ebdf7d509951" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "song_collaborators" ADD CONSTRAINT "FK_aa0031d1f1aae796e950d771da0" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
