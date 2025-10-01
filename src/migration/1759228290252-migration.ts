import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1759228290252 implements MigrationInterface {
  name = 'Migration1759228290252';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "pageColors"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "previewClipUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "artistName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "previewClips" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "coverArtLink" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_links" ADD "releaseDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP CONSTRAINT "FK_a024321337ca85057640a94d9c2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_ratedfans_pages_artist_song"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ALTER COLUMN "songId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_ratedfans_links_page_platform"`,
    );

    // Step 1: Convert enum columns to text temporarily
    await queryRunner.query(
      `ALTER TABLE "ratedfans_links" ALTER COLUMN "platform" TYPE text`,
    );
    await queryRunner.query(
      `ALTER TABLE "presave_signups" ALTER COLUMN "platform" TYPE text`,
    );

    // Step 2: Update the data to new enum values
    await queryRunner.query(`
          UPDATE "ratedfans_links" 
          SET "platform" = CASE 
            WHEN "platform" = 'apple_music' THEN 'appleMusic'
            WHEN "platform" = 'youtube_music' THEN 'youtubeMusic'
            WHEN "platform" = 'amazon_music' THEN 'amazonMusic'
            WHEN "platform" = 'soundcloud' THEN 'audiomack'
            WHEN "platform" = 'bandcamp' THEN 'audiomack'
            WHEN "platform" = 'boomplay' THEN 'audiomack'
            ELSE "platform"
          END
        `);

    await queryRunner.query(`
          UPDATE "presave_signups" 
          SET "platform" = CASE 
            WHEN "platform" = 'apple_music' THEN 'appleMusic'
            WHEN "platform" = 'youtube_music' THEN 'youtubeMusic'
            WHEN "platform" = 'amazon_music' THEN 'amazonMusic'
            WHEN "platform" = 'soundcloud' THEN 'audiomack'
            WHEN "platform" = 'bandcamp' THEN 'audiomack'
            WHEN "platform" = 'boomplay' THEN 'audiomack'
            ELSE "platform"
          END
        `);

    // Step 3: Create new enum types
    await queryRunner.query(
      `CREATE TYPE "public"."ratedfans_links_platform_enum_new" AS ENUM('spotify', 'appleMusic', 'youtubeMusic', 'deezer', 'tidal', 'audiomack', 'iHeartRadio', 'amazonMusic', 'iTunes', 'vevo')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."presave_signups_platform_enum_new" AS ENUM('spotify', 'appleMusic', 'youtubeMusic', 'deezer', 'tidal', 'audiomack', 'iHeartRadio', 'amazonMusic', 'iTunes', 'vevo')`,
    );

    // Step 4: Convert columns back to new enum types
    await queryRunner.query(
      `ALTER TABLE "ratedfans_links" ALTER COLUMN "platform" TYPE "public"."ratedfans_links_platform_enum_new" USING "platform"::"public"."ratedfans_links_platform_enum_new"`,
    );
    await queryRunner.query(
      `ALTER TABLE "presave_signups" ALTER COLUMN "platform" TYPE "public"."presave_signups_platform_enum_new" USING "platform"::"public"."presave_signups_platform_enum_new"`,
    );

    // Step 5: Drop old enum types and rename new ones
    await queryRunner.query(
      `DROP TYPE "public"."ratedfans_links_platform_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."presave_signups_platform_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ratedfans_links_platform_enum_new" RENAME TO "ratedfans_links_platform_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."presave_signups_platform_enum_new" RENAME TO "presave_signups_platform_enum"`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_ratedfans_pages_artist_song" ON "ratedfans_pages" ("artistId", "songId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_ratedfans_links_page_platform" ON "ratedfans_links" ("pageId", "platform") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD CONSTRAINT "FK_a024321337ca85057640a94d9c2" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP CONSTRAINT "FK_a024321337ca85057640a94d9c2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_ratedfans_links_page_platform"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_ratedfans_pages_artist_song"`,
    );

    // Convert back to text
    await queryRunner.query(
      `ALTER TABLE "ratedfans_links" ALTER COLUMN "platform" TYPE text`,
    );
    await queryRunner.query(
      `ALTER TABLE "presave_signups" ALTER COLUMN "platform" TYPE text`,
    );

    // Revert data changes
    await queryRunner.query(`
          UPDATE "ratedfans_links" 
          SET "platform" = CASE 
            WHEN "platform" = 'appleMusic' THEN 'apple_music'
            WHEN "platform" = 'youtubeMusic' THEN 'youtube_music'
            WHEN "platform" = 'amazonMusic' THEN 'amazon_music'
            WHEN "platform" = 'audiomack' THEN 'soundcloud'
            ELSE "platform"
          END
        `);

    await queryRunner.query(`
          UPDATE "presave_signups" 
          SET "platform" = CASE 
            WHEN "platform" = 'appleMusic' THEN 'apple_music'
            WHEN "platform" = 'youtubeMusic' THEN 'youtube_music'
            WHEN "platform" = 'amazonMusic' THEN 'amazon_music'
            WHEN "platform" = 'audiomack' THEN 'soundcloud'
            ELSE "platform"
          END
        `);

    // Recreate old enum types
    await queryRunner.query(
      `CREATE TYPE "public"."ratedfans_links_platform_enum_old" AS ENUM('spotify', 'apple_music', 'amazon_music', 'youtube_music', 'deezer', 'tidal', 'audiomack', 'soundcloud', 'bandcamp', 'boomplay')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."presave_signups_platform_enum_old" AS ENUM('spotify', 'apple_music', 'amazon_music', 'youtube_music', 'deezer', 'tidal', 'audiomack', 'soundcloud', 'bandcamp', 'boomplay')`,
    );

    // Convert back to old enum types
    await queryRunner.query(
      `ALTER TABLE "ratedfans_links" ALTER COLUMN "platform" TYPE "public"."ratedfans_links_platform_enum_old" USING "platform"::"public"."ratedfans_links_platform_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "presave_signups" ALTER COLUMN "platform" TYPE "public"."presave_signups_platform_enum_old" USING "platform"::"public"."presave_signups_platform_enum_old"`,
    );

    // Drop new enum types and rename old ones
    await queryRunner.query(
      `DROP TYPE "public"."ratedfans_links_platform_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."presave_signups_platform_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ratedfans_links_platform_enum_old" RENAME TO "ratedfans_links_platform_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."presave_signups_platform_enum_old" RENAME TO "presave_signups_platform_enum"`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_ratedfans_links_page_platform" ON "ratedfans_links" ("pageId", "platform") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ALTER COLUMN "songId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ratedfans_pages_artist_song" ON "ratedfans_pages" ("artistId", "songId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD CONSTRAINT "FK_a024321337ca85057640a94d9c2" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_links" DROP COLUMN "releaseDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "coverArtLink"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "previewClips"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "artistName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "previewClipUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "pageColors" jsonb`,
    );
  }
}
