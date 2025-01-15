import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1736918447124 implements MigrationInterface {
    name = 'Migration1736918447124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "artists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "country" character varying NOT NULL, "phoneNumber" character varying NOT NULL, "website" character varying, "genres" text NOT NULL, "bio" text, "musicPlatforms" jsonb NOT NULL, "socialMediaLinks" jsonb NOT NULL, "userId" uuid, "labelId" uuid, CONSTRAINT "PK_09b823d4607d2675dc4ffa82261" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "artists" ADD CONSTRAINT "FK_f7bd9114dc2849a90d39512911b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "artists" ADD CONSTRAINT "FK_539df2da3266ea3be5107f73a4b" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "songs" ADD CONSTRAINT "FK_909b985984ad0e366bcdb4224d0" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "songs" DROP CONSTRAINT "FK_909b985984ad0e366bcdb4224d0"`);
        await queryRunner.query(`ALTER TABLE "artists" DROP CONSTRAINT "FK_539df2da3266ea3be5107f73a4b"`);
        await queryRunner.query(`ALTER TABLE "artists" DROP CONSTRAINT "FK_f7bd9114dc2849a90d39512911b"`);
        await queryRunner.query(`DROP TABLE "artists"`);
    }

}
