import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1727022015332 implements MigrationInterface {
    name = 'InitialSchema1727022015332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'artist', 'normal')`);
        await queryRunner.query(`CREATE TYPE "public"."users_subscription_enum" AS ENUM('independent', 'pro', 'label', 'free')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "isEmailVerified" boolean NOT NULL DEFAULT false, "emailVerificationToken" character varying, "emailVerificationTokenExpiration" TIMESTAMP, "resetToken" character varying, "resetTokenExpiration" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "role" "public"."users_role_enum" NOT NULL DEFAULT 'normal', "profile" character varying, "image" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "subscription" "public"."users_subscription_enum" NOT NULL DEFAULT 'free', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_subscription_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
