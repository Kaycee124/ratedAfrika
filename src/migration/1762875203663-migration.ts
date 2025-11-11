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
                    '60c91152-52a2-4bb5-b0f3-5249dd269397',
                    '6fe19638-e47f-47cd-b3d0-b7ed32c1b744',
                    '8555047e-210a-436c-a695-c105dec73cfd',
                    '980223b2-4687-4baa-8955-abb6d152d262',
                    'a2f4bf8a-ac91-4324-b171-1573001e9eec',
                    'a6296dec-e682-4e0a-8c39-e1fdfb31bb09',
                    'c3c313e8-0720-4f8e-9df1-749e4eb19859',
                    'd2f326e2-700f-457d-a858-ffcc4de58a5d',
                    'e22c7eec-f6b7-4bfe-ad81-cff96b09468a',
                    'f0151952-b47a-42c2-a172-4a5be6f19e01'
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
