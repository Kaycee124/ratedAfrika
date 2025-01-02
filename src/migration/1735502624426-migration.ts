import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1735502624426 implements MigrationInterface {
    name = 'Migration1735502624426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."files_status_enum" AS ENUM('pending', 'processing', 'complete', 'failed', 'deleted')`);
        await queryRunner.query(`CREATE TYPE "public"."files_validationstatus_enum" AS ENUM('pending', 'in_progress', 'passed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "originalFilename" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "path" character varying NOT NULL, "bucket" character varying NOT NULL, "key" character varying NOT NULL, "status" "public"."files_status_enum" NOT NULL DEFAULT 'pending', "validationStatus" "public"."files_validationstatus_enum" NOT NULL DEFAULT 'pending', "metadata" jsonb, "validationResults" jsonb, "processingResults" jsonb, "isPublic" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "lastAccessedAt" TIMESTAMP, "downloadCount" integer NOT NULL DEFAULT '0', "storageKey" character varying NOT NULL, "uploadedById" uuid, CONSTRAINT "UQ_f734c17eff711279fdda38cc4ae" UNIQUE ("storageKey"), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audio_files_status_enum" AS ENUM('pending', 'processing', 'complete', 'failed', 'deleted')`);
        await queryRunner.query(`CREATE TYPE "public"."audio_files_validationstatus_enum" AS ENUM('pending', 'in_progress', 'passed', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."audio_files_format_enum" AS ENUM('mp3', 'wav', 'flac', 'aac', 'ogg')`);
        await queryRunner.query(`CREATE TYPE "public"."audio_files_quality_enum" AS ENUM('master', 'high', 'standard', 'preview')`);
        await queryRunner.query(`CREATE TABLE "audio_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "originalFilename" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "path" character varying NOT NULL, "bucket" character varying NOT NULL, "key" character varying NOT NULL, "status" "public"."audio_files_status_enum" NOT NULL DEFAULT 'pending', "validationStatus" "public"."audio_files_validationstatus_enum" NOT NULL DEFAULT 'pending', "metadata" jsonb, "validationResults" jsonb, "processingResults" jsonb, "isPublic" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "lastAccessedAt" TIMESTAMP, "downloadCount" integer NOT NULL DEFAULT '0', "storageKey" character varying NOT NULL, "format" "public"."audio_files_format_enum" NOT NULL, "quality" "public"."audio_files_quality_enum" NOT NULL DEFAULT 'master', "duration" integer NOT NULL, "bitrate" integer NOT NULL, "sampleRate" integer NOT NULL, "channels" integer NOT NULL, "waveform" jsonb, "loudness" double precision, "spectrum" jsonb, "encoderSettings" character varying, "analysis" jsonb, "hasClipping" boolean NOT NULL DEFAULT false, "isNormalized" boolean NOT NULL DEFAULT false, "masterVersionId" character varying, "uploadedById" uuid, CONSTRAINT "UQ_2557a7d44257288d803c01f0120" UNIQUE ("storageKey"), CONSTRAINT "PK_687c178ef33b4e0e1f83ae66cbb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."image_files_status_enum" AS ENUM('pending', 'processing', 'complete', 'failed', 'deleted')`);
        await queryRunner.query(`CREATE TYPE "public"."image_files_validationstatus_enum" AS ENUM('pending', 'in_progress', 'passed', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."image_files_format_enum" AS ENUM('jpeg', 'png', 'webp', 'gif', 'svg')`);
        await queryRunner.query(`CREATE TYPE "public"."image_files_sizetype_enum" AS ENUM('original', 'large', 'medium', 'small', 'thumbnail')`);
        await queryRunner.query(`CREATE TABLE "image_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "originalFilename" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "path" character varying NOT NULL, "bucket" character varying NOT NULL, "key" character varying NOT NULL, "status" "public"."image_files_status_enum" NOT NULL DEFAULT 'pending', "validationStatus" "public"."image_files_validationstatus_enum" NOT NULL DEFAULT 'pending', "metadata" jsonb, "validationResults" jsonb, "processingResults" jsonb, "isPublic" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "lastAccessedAt" TIMESTAMP, "downloadCount" integer NOT NULL DEFAULT '0', "storageKey" character varying NOT NULL, "format" "public"."image_files_format_enum" NOT NULL, "sizeType" "public"."image_files_sizetype_enum" NOT NULL DEFAULT 'original', "width" integer NOT NULL, "height" integer NOT NULL, "dpi" integer, "colorSpace" character varying, "bitDepth" integer, "hasAlpha" boolean NOT NULL DEFAULT false, "colorProfile" jsonb, "compression" jsonb, "analysis" jsonb, "originalVersionId" character varying, "uploadedById" uuid, CONSTRAINT "UQ_25ee2025fdac4a1307377409e64" UNIQUE ("storageKey"), CONSTRAINT "PK_2fa5a07f4784790123c4bf07f41" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."video_files_status_enum" AS ENUM('pending', 'processing', 'complete', 'failed', 'deleted')`);
        await queryRunner.query(`CREATE TYPE "public"."video_files_validationstatus_enum" AS ENUM('pending', 'in_progress', 'passed', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."video_files_format_enum" AS ENUM('mp4', 'mov', 'avi', 'mkv', 'webm')`);
        await queryRunner.query(`CREATE TYPE "public"."video_files_quality_enum" AS ENUM('master', 'hd', 'sd', 'low', 'preview')`);
        await queryRunner.query(`CREATE TABLE "video_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "originalFilename" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "path" character varying NOT NULL, "bucket" character varying NOT NULL, "key" character varying NOT NULL, "status" "public"."video_files_status_enum" NOT NULL DEFAULT 'pending', "validationStatus" "public"."video_files_validationstatus_enum" NOT NULL DEFAULT 'pending', "metadata" jsonb, "validationResults" jsonb, "processingResults" jsonb, "isPublic" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "lastAccessedAt" TIMESTAMP, "downloadCount" integer NOT NULL DEFAULT '0', "storageKey" character varying NOT NULL, "format" "public"."video_files_format_enum" NOT NULL, "quality" "public"."video_files_quality_enum" NOT NULL DEFAULT 'master', "duration" integer NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "frameRate" double precision NOT NULL, "bitrate" integer NOT NULL, "videoStream" jsonb NOT NULL, "audioStream" jsonb, "encodingSettings" jsonb, "analysis" jsonb, "thumbnailKey" character varying, "masterVersionId" character varying, "uploadedById" uuid, CONSTRAINT "UQ_27ff4a02eb7b5a896f0a62aeaee" UNIQUE ("storageKey"), CONSTRAINT "PK_bbf7ca354ae34a4d1fd3f4a5a1e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "file_chunks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uploadId" character varying NOT NULL, "chunkNumber" integer NOT NULL, "totalChunks" integer NOT NULL, "chunkSize" integer NOT NULL, "storageKey" character varying NOT NULL, "metadata" jsonb, "uploaded" boolean NOT NULL DEFAULT false, "error" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP, "fileId" uuid, CONSTRAINT "PK_a2c49176d54c6ad7d6c6b841afa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_a525d85f0ac59aa9a971825e1af" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audio_files" ADD CONSTRAINT "FK_f0c1a412a45bb25fb409a75d21f" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "image_files" ADD CONSTRAINT "FK_bdd377e4be046c911f68fe51da9" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "video_files" ADD CONSTRAINT "FK_3de327d0c71c191f9cb36b2ce1e" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_chunks" ADD CONSTRAINT "FK_fa6b569d259975a6e35a7851c69" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "file_chunks" DROP CONSTRAINT "FK_fa6b569d259975a6e35a7851c69"`);
        await queryRunner.query(`ALTER TABLE "video_files" DROP CONSTRAINT "FK_3de327d0c71c191f9cb36b2ce1e"`);
        await queryRunner.query(`ALTER TABLE "image_files" DROP CONSTRAINT "FK_bdd377e4be046c911f68fe51da9"`);
        await queryRunner.query(`ALTER TABLE "audio_files" DROP CONSTRAINT "FK_f0c1a412a45bb25fb409a75d21f"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_a525d85f0ac59aa9a971825e1af"`);
        await queryRunner.query(`DROP TABLE "file_chunks"`);
        await queryRunner.query(`DROP TABLE "video_files"`);
        await queryRunner.query(`DROP TYPE "public"."video_files_quality_enum"`);
        await queryRunner.query(`DROP TYPE "public"."video_files_format_enum"`);
        await queryRunner.query(`DROP TYPE "public"."video_files_validationstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."video_files_status_enum"`);
        await queryRunner.query(`DROP TABLE "image_files"`);
        await queryRunner.query(`DROP TYPE "public"."image_files_sizetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."image_files_format_enum"`);
        await queryRunner.query(`DROP TYPE "public"."image_files_validationstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."image_files_status_enum"`);
        await queryRunner.query(`DROP TABLE "audio_files"`);
        await queryRunner.query(`DROP TYPE "public"."audio_files_quality_enum"`);
        await queryRunner.query(`DROP TYPE "public"."audio_files_format_enum"`);
        await queryRunner.query(`DROP TYPE "public"."audio_files_validationstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."audio_files_status_enum"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP TYPE "public"."files_validationstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."files_status_enum"`);
    }

}
