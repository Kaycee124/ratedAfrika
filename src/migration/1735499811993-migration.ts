import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1735499811993 implements MigrationInterface {
  name = 'Migration1735499811993';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "image"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "profileImage" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phoneNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "country" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profileImage"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "image" text`);
  }
}
