import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1762875203663 implements MigrationInterface {
  name = 'Migration1762875203663';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- songId ---
    // 1. Add "songId" as nullable first
    await queryRunner.query(`ALTER TABLE "collaborators" ADD "songId" uuid`);

    // 2. Populate existing rows with a random songId from your list
    await queryRunner.query(`
            UPDATE "collaborators" 
            SET "songId" = (
                ARRAY[
                    '15cca3bf-ddf3-465e-ac3d-32b3c49e929e',
                    '15cca3bf-ddf3-465e-ac3d-32b3c49e929e'
                ]
            )[floor(random() * 10 + 1)]::uuid
            WHERE "songId" IS NULL
        `);

    // 3. Now that no rows are null, set the column to NOT NULL
    await queryRunner.query(
      `ALTER TABLE "collaborators" ALTER COLUMN "songId" SET NOT NULL`,
    );

    // --- Other columns ---
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "creditedAs" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "displayOrder" integer`,
    );

    // --- [REMOVED] This logic is a duplicate from migration 1762000000000 ---
    // await queryRunner.query(`ALTER TYPE "public"."users_subscription_enum" RENAME TO "users_subscription_enum_old"`);
    // await queryRunner.query(`CREATE TYPE "public"."users_subscription_enum" AS ENUM('free', 'independent', 'pro', 'label')`);
    // await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "subscription" DROP DEFAULT`);
    // await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "subscription" TYPE "public"."users_subscription_enum" USING "subscription"::"text"::"public"."users_subscription_enum"`);
    // await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "subscription" SET DEFAULT 'free'`);
    // await queryRunner.query(`DROP TYPE "public"."users_subscription_enum_old"`);
    // --- End of removed section ---

    // --- collaborator role ---
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP CONSTRAINT "UQ_b210f505222bd59004a77165857"`,
    );
    await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "role"`);
    await queryRunner.query(
      `CREATE TYPE "public"."collaborators_role_enum" AS ENUM('Producer', 'Writer', 'Composer', 'Lyricist', 'Mix Engineer', 'Mastering Engineer', 'Featured Artist', 'Remixer', 'Musician', 'Arranger', 'Other')`,
    );

    // 1. Add "role" as nullable first
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "role" "public"."collaborators_role_enum"`,
    );

    // 2. Populate existing rows with a random role
    await queryRunner.query(`
            UPDATE "collaborators"
            SET "role" = (
                ARRAY[
                    'Producer', 'Writer', 'Composer', 'Lyricist', 'Mix Engineer', 
                    'Mastering Engineer', 'Featured Artist', 'Remixer', 'Musician', 
                    'Arranger', 'Other'
                ]
            )[floor(random() * 11 + 1)]::"public"."collaborators_role_enum"
            WHERE "role" IS NULL
        `);

    // 3. Now that no rows are null, set the column to NOT NULL
    await queryRunner.query(
      `ALTER TABLE "collaborators" ALTER COLUMN "role" SET NOT NULL`,
    );

    // --- Foreign Key ---
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD CONSTRAINT "FK_8124c8d02e6d4729ebbd10f94fa" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP CONSTRAINT "FK_8124c8d02e6d4729ebbd10f94fa"`,
    );
    await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."collaborators_role_enum"`);
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD "role" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" ADD CONSTRAINT "UQ_b210f505222bd59004a77165857" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_subscription_enum_old" AS ENUM('artist', 'free', 'label')`,
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
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP COLUMN "displayOrder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collaborators" DROP COLUMN "creditedAs"`,
    );
    await queryRunner.query(`ALTER TABLE "collaborators" DROP COLUMN "songId"`);
  }
}
