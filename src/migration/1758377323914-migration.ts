import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1758377323914 implements MigrationInterface {
    name = 'Migration1758377323914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ratedfans_pages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "artistId" uuid NOT NULL, "songId" uuid NOT NULL, "isPublished" boolean NOT NULL DEFAULT false, "isPresaveEnabled" boolean NOT NULL DEFAULT false, "releaseDate" TIMESTAMP, "customArtworkUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_95f5b723edb71e0b2425899cb5b" UNIQUE ("slug"), CONSTRAINT "PK_4cc881ce092f0bfc1d50d05123f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_95f5b723edb71e0b2425899cb5" ON "ratedfans_pages" ("slug") `);
        await queryRunner.query(`CREATE INDEX "idx_ratedfans_pages_published" ON "ratedfans_pages" ("isPublished") `);
        await queryRunner.query(`CREATE INDEX "idx_ratedfans_pages_artist_song" ON "ratedfans_pages" ("artistId", "songId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_ratedfans_pages_slug" ON "ratedfans_pages" ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."ratedfans_links_platform_enum" AS ENUM('spotify', 'apple_music', 'amazon_music', 'youtube_music', 'deezer', 'tidal', 'audiomack', 'soundcloud', 'bandcamp', 'boomplay')`);
        await queryRunner.query(`CREATE TABLE "ratedfans_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pageId" uuid NOT NULL, "platform" "public"."ratedfans_links_platform_enum" NOT NULL, "url" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isPrimary" boolean NOT NULL DEFAULT false, "displayOrder" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ca94a2c46e0e0fdef3b559c5ebb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_ratedfans_links_active" ON "ratedfans_links" ("isActive") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_ratedfans_links_page_platform" ON "ratedfans_links" ("pageId", "platform") `);
        await queryRunner.query(`CREATE TYPE "public"."presave_signups_platform_enum" AS ENUM('spotify', 'apple_music', 'amazon_music', 'youtube_music', 'deezer', 'tidal', 'audiomack', 'soundcloud', 'bandcamp', 'boomplay')`);
        await queryRunner.query(`CREATE TYPE "public"."presave_signups_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'completed')`);
        await queryRunner.query(`CREATE TABLE "presave_signups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pageId" uuid NOT NULL, "email" character varying NOT NULL, "platform" "public"."presave_signups_platform_enum" NOT NULL, "status" "public"."presave_signups_status_enum" NOT NULL DEFAULT 'pending', "confirmationToken" character varying, "confirmedAt" TIMESTAMP, "notifiedAt" TIMESTAMP, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3768080e9fe074f0096f292dbd4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_presave_signups_platform" ON "presave_signups" ("platform") `);
        await queryRunner.query(`CREATE INDEX "idx_presave_signups_status" ON "presave_signups" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_presave_signups_page_email" ON "presave_signups" ("pageId", "email") `);
        await queryRunner.query(`CREATE TABLE "promo_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pageId" uuid NOT NULL, "fileUrl" character varying NOT NULL, "fileName" character varying NOT NULL, "size" bigint NOT NULL, "mimeType" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4c52194dbe499a9ab512ebc4696" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_promo_cards_page" ON "promo_cards" ("pageId") `);
        await queryRunner.query(`ALTER TABLE "lyrics" ALTER COLUMN "synchronizedLyrics" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "ratedfans_pages" ADD CONSTRAINT "FK_2ab0182cbd7520f3f238d9c1d43" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ratedfans_pages" ADD CONSTRAINT "FK_a024321337ca85057640a94d9c2" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ratedfans_links" ADD CONSTRAINT "FK_b391f6fccce712ebdc8b45cab0c" FOREIGN KEY ("pageId") REFERENCES "ratedfans_pages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "presave_signups" ADD CONSTRAINT "FK_7d3fc4798134fdb4272866cb593" FOREIGN KEY ("pageId") REFERENCES "ratedfans_pages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promo_cards" ADD CONSTRAINT "FK_c02105bfcfd524bb03671380431" FOREIGN KEY ("pageId") REFERENCES "ratedfans_pages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "promo_cards" DROP CONSTRAINT "FK_c02105bfcfd524bb03671380431"`);
        await queryRunner.query(`ALTER TABLE "presave_signups" DROP CONSTRAINT "FK_7d3fc4798134fdb4272866cb593"`);
        await queryRunner.query(`ALTER TABLE "ratedfans_links" DROP CONSTRAINT "FK_b391f6fccce712ebdc8b45cab0c"`);
        await queryRunner.query(`ALTER TABLE "ratedfans_pages" DROP CONSTRAINT "FK_a024321337ca85057640a94d9c2"`);
        await queryRunner.query(`ALTER TABLE "ratedfans_pages" DROP CONSTRAINT "FK_2ab0182cbd7520f3f238d9c1d43"`);
        await queryRunner.query(`ALTER TABLE "lyrics" ALTER COLUMN "synchronizedLyrics" DROP DEFAULT`);
        await queryRunner.query(`DROP INDEX "public"."idx_promo_cards_page"`);
        await queryRunner.query(`DROP TABLE "promo_cards"`);
        await queryRunner.query(`DROP INDEX "public"."idx_presave_signups_page_email"`);
        await queryRunner.query(`DROP INDEX "public"."idx_presave_signups_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_presave_signups_platform"`);
        await queryRunner.query(`DROP TABLE "presave_signups"`);
        await queryRunner.query(`DROP TYPE "public"."presave_signups_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."presave_signups_platform_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ratedfans_links_page_platform"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ratedfans_links_active"`);
        await queryRunner.query(`DROP TABLE "ratedfans_links"`);
        await queryRunner.query(`DROP TYPE "public"."ratedfans_links_platform_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ratedfans_pages_slug"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ratedfans_pages_artist_song"`);
        await queryRunner.query(`DROP INDEX "public"."idx_ratedfans_pages_published"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_95f5b723edb71e0b2425899cb5"`);
        await queryRunner.query(`DROP TABLE "ratedfans_pages"`);
    }

}
