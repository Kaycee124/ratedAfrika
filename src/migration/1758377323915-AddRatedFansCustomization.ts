import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRatedFansCustomization1758377323915 implements MigrationInterface {
  name = 'AddRatedFansCustomization1758377323915';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 2024-09-22: change: rename title to releaseTitle
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" RENAME COLUMN "title" TO "releaseTitle"`,
    );

    // 2024-09-22: change: add page colors storage
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "pageColors" jsonb`,
    );

    // 2024-09-22: change: add release type enum
    await queryRunner.query(
      `CREATE TYPE "public"."ratedfans_pages_releasetype_enum" AS ENUM('Single', 'EP', 'Album', 'Mixtape', 'Live', 'Remix')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "releaseType" "public"."ratedfans_pages_releasetype_enum"`,
    );

    // 2024-09-22: change: add page-specific social media links
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "socialMediaLinks" jsonb`,
    );

    // 2024-09-22: change: add custom preview clip URL
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "previewClipUrl" character varying`,
    );

    // 2024-09-22: change: remove customArtworkUrl, use song's cover art instead
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "customArtworkUrl"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back customArtworkUrl
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" ADD "customArtworkUrl" character varying`,
    );

    // Remove new columns
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "previewClipUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "socialMediaLinks"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "releaseType"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ratedfans_pages_releasetype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" DROP COLUMN "pageColors"`,
    );

    // Rename releaseTitle back to title
    await queryRunner.query(
      `ALTER TABLE "ratedfans_pages" RENAME COLUMN "releaseTitle" TO "title"`,
    );
  }
}
