import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSubscriptionPlans1762000000000
  implements MigrationInterface
{
  name = 'UpdateSubscriptionPlans1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Alter column to use text temporarily
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" TYPE text`,
    );

    // Step 2: Update existing 'artist' subscriptions to 'pro'
    await queryRunner.query(
      `UPDATE "users" SET "subscription" = 'pro' WHERE "subscription" = 'artist'`,
    );

    // Step 3: Drop old enum type
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."users_subscription_enum"`,
    );

    // Step 4: Create new enum type with updated values
    await queryRunner.query(
      `CREATE TYPE "public"."users_subscription_enum" AS ENUM('free', 'independent', 'pro', 'label')`,
    );

    // Step 5: Convert column back to enum type with new values
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" TYPE "public"."users_subscription_enum" USING "subscription"::"public"."users_subscription_enum"`,
    );

    // Step 6: Set default value to 'free'
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" SET DEFAULT 'free'`,
    );

    console.log(
      'Migration completed: All ARTIST subscriptions have been converted to PRO',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Alter column to use text temporarily
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" TYPE text`,
    );

    // Step 2: Update 'pro' back to 'artist' and remove 'independent' (set to 'free')
    await queryRunner.query(
      `UPDATE "users" SET "subscription" = 'artist' WHERE "subscription" = 'pro'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "subscription" = 'free' WHERE "subscription" = 'independent'`,
    );

    // Step 3: Drop new enum type
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."users_subscription_enum"`,
    );

    // Step 4: Create old enum type
    await queryRunner.query(
      `CREATE TYPE "public"."users_subscription_enum" AS ENUM('free', 'artist', 'label')`,
    );

    // Step 5: Convert column back to enum type
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" TYPE "public"."users_subscription_enum" USING "subscription"::"public"."users_subscription_enum"`,
    );

    // Step 6: Set default value back to 'free'
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "subscription" SET DEFAULT 'free'`,
    );

    console.log(
      'Migration reverted: All PRO subscriptions have been converted back to ARTIST',
    );
  }
}
