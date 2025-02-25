import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1737233997874 implements MigrationInterface {
  name = 'Migration1737233997874';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "songs" DROP CONSTRAINT "FK_909b985984ad0e366bcdb4224d0"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."song_collaborators_role_enum" AS ENUM('m&m', 'producer', 'writer', 'featured')`,
    );
    await queryRunner.query(
      `CREATE TABLE "song_collaborators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "songId" uuid NOT NULL, "collaboratorId" uuid NOT NULL, "role" "public"."song_collaborators_role_enum" NOT NULL, "splitPercentage" numeric(5,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_18218bdc4fd42b5ebdf7d509951" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temp_artists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "hasStreamingPresence" boolean NOT NULL DEFAULT false, "spotifyUrl" character varying, "appleMusicUrl" character varying, "youtubeUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_120550a6fca5a95aec2d2bf74d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."release_containers_type_enum" AS ENUM('EP', 'ALBUM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."release_containers_status_enum" AS ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETE', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "release_containers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "type" "public"."release_containers_type_enum" NOT NULL, "releaseLanguage" character varying NOT NULL, "primaryGenre" character varying NOT NULL, "secondaryGenres" text, "recordingYear" integer NOT NULL, "upc" character varying, "catalogNumber" character varying, "description" text, "totalTracks" integer NOT NULL, "uploadedTracks" integer NOT NULL DEFAULT '0', "lastUploadedTrackNumber" integer, "completedAt" TIMESTAMP, "label" character varying NOT NULL, "coverArtId" character varying NOT NULL, "originalReleaseDate" TIMESTAMP, "proposedReleaseDate" TIMESTAMP NOT NULL, "releaseTime" character varying NOT NULL, "isPreOrder" boolean NOT NULL DEFAULT false, "preOrderDate" TIMESTAMP, "price" numeric(10,2) NOT NULL, "targetStores" text NOT NULL, "targetCountries" text NOT NULL, "status" "public"."release_containers_status_enum" NOT NULL DEFAULT 'DRAFT', "reviewNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "uploadedById" uuid, "isExplicit" boolean NOT NULL DEFAULT false, "primaryArtistId" uuid, CONSTRAINT "PK_e861471b8e2d4b68e658b46ef61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "release_container_featured_artists" ("container_id" uuid NOT NULL, "artist_id" uuid NOT NULL, CONSTRAINT "PK_56fe618399120d4edebb0d3a27c" PRIMARY KEY ("container_id", "artist_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f642e9450e265bc8e8874c9fe" ON "release_container_featured_artists" ("container_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9b391b3cae8cd5e3e097e914ad" ON "release_container_featured_artists" ("artist_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "release_container_featured_temp_artists" ("container_id" uuid NOT NULL, "temp_artist_id" uuid NOT NULL, CONSTRAINT "PK_b6ebcbe925f790bf92659fa6910" PRIMARY KEY ("container_id", "temp_artist_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4768f3456814c77f3f16346f64" ON "release_container_featured_temp_artists" ("container_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_324141f738c918793a4b925766" ON "release_container_featured_temp_artists" ("temp_artist_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "song_featured_artists" ("song_id" uuid NOT NULL, "artist_id" uuid NOT NULL, CONSTRAINT "PK_9bd3b0b82f79b654bb7b4fcbf58" PRIMARY KEY ("song_id", "artist_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3748b7c54e518df2e26acfcc9" ON "song_featured_artists" ("song_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b69e21df84c9ad1d583b39ed7e" ON "song_featured_artists" ("artist_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "song_featured_temp_artists" ("song_id" uuid NOT NULL, "temp_artist_id" uuid NOT NULL, CONSTRAINT "PK_04c29d23f27c4db22ca4b7ec560" PRIMARY KEY ("song_id", "temp_artist_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad75ed868b666dc10ccd8ae856" ON "song_featured_temp_artists" ("song_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a2a9ebf4ad76daa68a1928f56" ON "song_featured_temp_artists" ("temp_artist_id") `,
    );
    await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."collaborators_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP COLUMN "paymentInfo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP COLUMN "isVerified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP COLUMN "artistId"`,
    );
    await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "taxId"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "songType"`);
    await queryRunner.query(`DROP TYPE "public"."songs_songtype_enum"`);
    await queryRunner.query(
      `ALTER TABLE "songs" DROP COLUMN "previewClipStartTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" DROP COLUMN "previewClipEndTime"`,
    );
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "audioFiles"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "royaltySplits"`);
    await queryRunner.query(
      `ALTER TABLE "songs" DROP COLUMN "proposedReleaseTime"`,
    );
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "artistId"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "genres"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "coverImage"`);
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "hasPublishedMusic" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."songs_releasetype_enum" AS ENUM('SINGLE', 'ALBUM', 'EP')`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "releaseType" "public"."songs_releasetype_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "label" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "primaryGenre" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "songs" ADD "secondaryGenres" text`);
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "isExplicit" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "coverArtId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "masterTrackId" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "songs" ADD "mixVersions" jsonb`);
    await queryRunner.query(`ALTER TABLE "songs" ADD "previewClip" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "originalReleaseDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "releaseTime" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "trackPrice" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "releaseContainerId" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "songs" ADD "trackNumber" integer`);
    await queryRunner.query(`ALTER TABLE "songs" ADD "uploadedById" uuid`);
    await queryRunner.query(`ALTER TABLE "songs" ADD "primaryArtistId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "songs" ALTER COLUMN "proposedReleaseDate" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."songs_status_enum" RENAME TO "songs_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."songs_status_enum" AS ENUM('DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'TAKEN_DOWN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ALTER COLUMN "status" TYPE "public"."songs_status_enum" USING "status"::"text"::"public"."songs_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`,
    );
    await queryRunner.query(`DROP TYPE "public"."songs_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD CONSTRAINT "FK_aa0031d1f1aae796e950d771da0" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_containers" ADD CONSTRAINT "FK_81b31b9899b0dcf42037a0486c8" FOREIGN KEY ("primaryArtistId") REFERENCES "artists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_containers" ADD CONSTRAINT "FK_0653392b8b9a0b778449afb8507" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD CONSTRAINT "FK_3ea40af60e7deab5fe355995969" FOREIGN KEY ("primaryArtistId") REFERENCES "artists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD CONSTRAINT "FK_dc7e3bd7dd229d873f0d4a4b0e6" FOREIGN KEY ("releaseContainerId") REFERENCES "release_containers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD CONSTRAINT "FK_277ccc2a69a45fe1c39291b05bb" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_container_featured_artists" ADD CONSTRAINT "FK_3f642e9450e265bc8e8874c9fe2" FOREIGN KEY ("container_id") REFERENCES "release_containers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_container_featured_artists" ADD CONSTRAINT "FK_9b391b3cae8cd5e3e097e914ad6" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_container_featured_temp_artists" ADD CONSTRAINT "FK_4768f3456814c77f3f16346f646" FOREIGN KEY ("container_id") REFERENCES "release_containers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_container_featured_temp_artists" ADD CONSTRAINT "FK_324141f738c918793a4b9257662" FOREIGN KEY ("temp_artist_id") REFERENCES "temp_artists"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_featured_artists" ADD CONSTRAINT "FK_a3748b7c54e518df2e26acfcc97" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_featured_artists" ADD CONSTRAINT "FK_b69e21df84c9ad1d583b39ed7e2" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_featured_temp_artists" ADD CONSTRAINT "FK_ad75ed868b666dc10ccd8ae8561" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_featured_temp_artists" ADD CONSTRAINT "FK_0a2a9ebf4ad76daa68a1928f567" FOREIGN KEY ("temp_artist_id") REFERENCES "temp_artists"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "song_featured_temp_artists" DROP CONSTRAINT "FK_0a2a9ebf4ad76daa68a1928f567"`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_featured_temp_artists" DROP CONSTRAINT "FK_ad75ed868b666dc10ccd8ae8561"`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_featured_artists" DROP CONSTRAINT "FK_b69e21df84c9ad1d583b39ed7e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_featured_artists" DROP CONSTRAINT "FK_a3748b7c54e518df2e26acfcc97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_container_featured_temp_artists" DROP CONSTRAINT "FK_324141f738c918793a4b9257662"`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_container_featured_temp_artists" DROP CONSTRAINT "FK_4768f3456814c77f3f16346f646"`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_container_featured_artists" DROP CONSTRAINT "FK_9b391b3cae8cd5e3e097e914ad6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_container_featured_artists" DROP CONSTRAINT "FK_3f642e9450e265bc8e8874c9fe2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" DROP CONSTRAINT "FK_277ccc2a69a45fe1c39291b05bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" DROP CONSTRAINT "FK_dc7e3bd7dd229d873f0d4a4b0e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" DROP CONSTRAINT "FK_3ea40af60e7deab5fe355995969"`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_containers" DROP CONSTRAINT "FK_0653392b8b9a0b778449afb8507"`,
    );
    await queryRunner.query(
      `ALTER TABLE "release_containers" DROP CONSTRAINT "FK_81b31b9899b0dcf42037a0486c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" DROP CONSTRAINT "FK_aa0031d1f1aae796e950d771da0"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."songs_status_enum_old" AS ENUM('draft', 'pending_review', 'in_review', 'approved', 'rejected', 'processing', 'ready_for_distribution', 'distributed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ALTER COLUMN "status" TYPE "public"."songs_status_enum_old" USING "status"::"text"::"public"."songs_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );
    await queryRunner.query(`DROP TYPE "public"."songs_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."songs_status_enum_old" RENAME TO "songs_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ALTER COLUMN "proposedReleaseDate" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" DROP COLUMN "primaryArtistId"`,
    );
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "uploadedById"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "trackNumber"`);
    await queryRunner.query(
      `ALTER TABLE "songs" DROP COLUMN "releaseContainerId"`,
    );
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "trackPrice"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "releaseTime"`);
    await queryRunner.query(
      `ALTER TABLE "songs" DROP COLUMN "originalReleaseDate"`,
    );
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "previewClip"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "mixVersions"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "masterTrackId"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "coverArtId"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "isExplicit"`);
    await queryRunner.query(
      `ALTER TABLE "songs" DROP COLUMN "secondaryGenres"`,
    );
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "primaryGenre"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "label"`);
    await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "releaseType"`);
    await queryRunner.query(`DROP TYPE "public"."songs_releasetype_enum"`);
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP COLUMN "hasPublishedMusic"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "coverImage" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "songs" ADD "genres" text NOT NULL`);
    await queryRunner.query(`ALTER TABLE "songs" ADD "artistId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "proposedReleaseTime" TIME`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "royaltySplits" jsonb NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "songs" ADD "audioFiles" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "previewClipEndTime" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "previewClipStartTime" integer`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."songs_songtype_enum" AS ENUM('clean', 'explicit', 'not_explicit')`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD "songType" "public"."songs_songtype_enum" NOT NULL DEFAULT 'not_explicit'`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "taxId" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "artistId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "isVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "paymentInfo" jsonb NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."collaborators_type_enum" AS ENUM('artist', 'producer', 'writer', 'performer', 'engineer', 'arranger')`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "type" "public"."collaborators_type_enum" NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a2a9ebf4ad76daa68a1928f56"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad75ed868b666dc10ccd8ae856"`,
    );
    await queryRunner.query(`DROP TABLE "song_featured_temp_artists"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b69e21df84c9ad1d583b39ed7e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3748b7c54e518df2e26acfcc9"`,
    );
    await queryRunner.query(`DROP TABLE "song_featured_artists"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_324141f738c918793a4b925766"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4768f3456814c77f3f16346f64"`,
    );
    await queryRunner.query(
      `DROP TABLE "release_container_featured_temp_artists"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9b391b3cae8cd5e3e097e914ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f642e9450e265bc8e8874c9fe"`,
    );
    await queryRunner.query(`DROP TABLE "release_container_featured_artists"`);
    await queryRunner.query(`DROP TABLE "release_containers"`);
    await queryRunner.query(
      `DROP TYPE "public"."release_containers_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."release_containers_type_enum"`,
    );
    await queryRunner.query(`DROP TABLE "temp_artists"`);
    await queryRunner.query(`DROP TABLE "song_collaborators"`);
    await queryRunner.query(
      `DROP TYPE "public"."song_collaborators_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD CONSTRAINT "FK_909b985984ad0e366bcdb4224d0" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
