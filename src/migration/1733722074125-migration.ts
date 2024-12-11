import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1733722074125 implements MigrationInterface {
  name = 'Migration1733722074125';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lyrics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "basicText" text NOT NULL, "synchronizedLyrics" jsonb NOT NULL, "songId" uuid NOT NULL, "version" integer NOT NULL, "isComplete" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying NOT NULL, "updatedBy" character varying NOT NULL, CONSTRAINT "PK_f7c5de22ef94f309591c5554f0f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."songs_songtype_enum" AS ENUM('clean', 'explicit', 'not_explicit')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."songs_status_enum" AS ENUM('draft', 'pending_review', 'in_review', 'approved', 'rejected', 'processing', 'ready_for_distribution', 'distributed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "songs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "songType" "public"."songs_songtype_enum" NOT NULL DEFAULT 'not_explicit', "genres" text NOT NULL, "isrc" character varying, "recordingYear" integer NOT NULL, "releaseLanguage" character varying NOT NULL, "previewClipStartTime" integer, "previewClipEndTime" integer, "audioFiles" jsonb, "coverImage" character varying, "musicVideo" jsonb, "royaltySplits" jsonb NOT NULL, "proposedReleaseDate" TIMESTAMP, "proposedReleaseTime" TIME, "isPreOrder" boolean NOT NULL DEFAULT false, "preOrderDate" TIMESTAMP, "targetStores" text NOT NULL, "targetCountries" text NOT NULL, "status" "public"."songs_status_enum" NOT NULL DEFAULT 'draft', "reviewNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "artistId" uuid, CONSTRAINT "PK_e504ce8ad2e291d3a1d8f1ea2f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "labels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "labelName" character varying NOT NULL, "legalEntityName" character varying NOT NULL, "logo" character varying, "bio" text, "genres" text NOT NULL, "socialMediaLinks" jsonb NOT NULL, "website" character varying, "contactInformation" jsonb NOT NULL, "taxId" character varying, "businessRegistrationNumber" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "UQ_5eddf31e3975cb712baad7d6341" UNIQUE ("labelName"), CONSTRAINT "PK_c0c4e97f76f1f3a268c7a70b925" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "artists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stageName" character varying NOT NULL, "legalName" character varying NOT NULL, "bio" text, "profilePicture" character varying, "genres" text NOT NULL, "socialMediaLinks" jsonb NOT NULL, "website" character varying, "email" character varying NOT NULL, "paymentInformation" jsonb NOT NULL, "userId" uuid, "labelId" uuid, CONSTRAINT "UQ_8a5047d4e6a40657c7cb81f2ed1" UNIQUE ("stageName"), CONSTRAINT "PK_09b823d4607d2675dc4ffa82261" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."collaborator_splits_splittype_enum" AS ENUM('WRITING', 'PERFORMANCE', 'PRODUCTION', 'PUBLISHING')`,
    );
    await queryRunner.query(
      `CREATE TABLE "collaborator_splits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "songId" uuid NOT NULL, "percentage" numeric(5,2) NOT NULL, "splitType" "public"."collaborator_splits_splittype_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "collaboratorId" uuid, CONSTRAINT "PK_23aa08e07a33d61a9214eb0615e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."collaborators_type_enum" AS ENUM('ARTIST', 'WRITER', 'PRODUCER', 'EXTERNAL', 'LABEL_ARTIST')`,
    );
    await queryRunner.query(
      `CREATE TABLE "collaborators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "type" "public"."collaborators_type_enum" NOT NULL, "artistId" character varying, "taxId" character varying NOT NULL, "paymentInfo" jsonb NOT NULL, "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b210f505222bd59004a77165857" UNIQUE ("email"), CONSTRAINT "PK_f579a5df9d66287f400806ad875" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."users_subscription_enum" RENAME TO "users_subscription_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_subscription_enum" AS ENUM('artist', 'label', 'free')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" TYPE "public"."users_subscription_enum" USING "subscription"::"text"::"public"."users_subscription_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" SET DEFAULT 'free'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_subscription_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "lyrics" ADD CONSTRAINT "FK_1929e3cdc8b3e28106e773b16d6" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" ADD CONSTRAINT "FK_909b985984ad0e366bcdb4224d0" FOREIGN KEY ("artistId") REFERENCES "artists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_f31f88025417e09223ea9a66b0b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "artists" ADD CONSTRAINT "FK_f7bd9114dc2849a90d39512911b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "artists" ADD CONSTRAINT "FK_539df2da3266ea3be5107f73a4b" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborator_splits" ADD CONSTRAINT "FK_4a2f3ed56e9ab705de563485d74" FOREIGN KEY ("collaboratorId") REFERENCES "collaborators"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collaborator_splits" DROP CONSTRAINT "FK_4a2f3ed56e9ab705de563485d74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "artists" DROP CONSTRAINT "FK_539df2da3266ea3be5107f73a4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "artists" DROP CONSTRAINT "FK_f7bd9114dc2849a90d39512911b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_f31f88025417e09223ea9a66b0b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "songs" DROP CONSTRAINT "FK_909b985984ad0e366bcdb4224d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lyrics" DROP CONSTRAINT "FK_1929e3cdc8b3e28106e773b16d6"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_subscription_enum_old" AS ENUM('independent', 'pro', 'label', 'free')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" TYPE "public"."users_subscription_enum_old" USING "subscription"::"text"::"public"."users_subscription_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" SET DEFAULT 'free'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_subscription_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_subscription_enum_old" RENAME TO "users_subscription_enum"`,
    );
    await queryRunner.query(`DROP TABLE "collaborators"`);
    await queryRunner.query(`DROP TYPE "public"."collaborators_type_enum"`);
    await queryRunner.query(`DROP TABLE "collaborator_splits"`);
    await queryRunner.query(
      `DROP TYPE "public"."collaborator_splits_splittype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "artists"`);
    await queryRunner.query(`DROP TABLE "labels"`);
    await queryRunner.query(`DROP TABLE "songs"`);
    await queryRunner.query(`DROP TYPE "public"."songs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."songs_songtype_enum"`);
    await queryRunner.query(`DROP TABLE "lyrics"`);
  }
}
