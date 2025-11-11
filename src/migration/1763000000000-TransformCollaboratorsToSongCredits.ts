import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransformCollaboratorsToSongCredits1763000000000
  implements MigrationInterface
{
  name = 'TransformCollaboratorsToSongCredits1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add id as primary key to song_collaborators
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" DROP CONSTRAINT IF EXISTS "PK_dd105deb43c0505b9e6984d5ad4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD CONSTRAINT "PK_song_collaborators" PRIMARY KEY ("id")`,
    );

    // 2. Rename columns to camelCase
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" RENAME COLUMN "song_id" TO "songId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" RENAME COLUMN "collaborator_id" TO "collaboratorId"`,
    );

    // 3. Add new columns for credit information
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "name" varchar NOT NULL DEFAULT 'Unknown'`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "email" varchar NOT NULL DEFAULT 'unknown@example.com'`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "role" varchar NOT NULL DEFAULT 'Collaborator'`,
    );

    // 4. Add social URLs
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "spotifyUrl" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "appleUrl" varchar`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "youtubeUrl" varchar`,
    );

    // 5. Add display order
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "displayOrder" integer`,
    );

    // 6. Add timestamps
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "deletedAt" TIMESTAMP`,
    );

    // 7. Add createdBy tracking
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD "createdByUserId" uuid`,
    );

    // 8. Migrate existing data from collaborators table (if any exist)
    // This will copy data from the old collaborators table if it exists
    await queryRunner.query(`
            UPDATE "song_collaborators" sc
            SET 
                name = COALESCE(c.name, 'Unknown'),
                email = COALESCE(c.email, 'unknown@example.com'),
                role = COALESCE(c.role::text, 'Collaborator'),
                "spotifyUrl" = c."spotifyUrl",
                "appleUrl" = c."appleUrl",
                "youtubeUrl" = c."youtubeUrl",
                "createdByUserId" = c."createdByUserId"
            FROM "collaborators" c
            WHERE sc."collaboratorId" = c.id
        `);

    // 9. Drop old foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" DROP CONSTRAINT IF EXISTS "FK_dc5253fe5e4f3e1645fe2a54e01"`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" DROP CONSTRAINT IF EXISTS "FK_8ad69d89a9ee6ad50f75c1dae59"`,
    );

    // 10. Drop old indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_dc5253fe5e4f3e1645fe2a54e0"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_8ad69d89a9ee6ad50f75c1dae5"`,
    );

    // 11. Drop collaboratorId column (no longer needed)
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" DROP COLUMN "collaboratorId"`,
    );

    // 12. Create new foreign keys
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD CONSTRAINT "FK_song_collaborators_songId" 
             FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ADD CONSTRAINT "FK_song_collaborators_createdBy" 
             FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL`,
    );

    // 13. Remove defaults after migration
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ALTER COLUMN "name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ALTER COLUMN "email" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "song_collaborators" ALTER COLUMN "role" DROP DEFAULT`,
    );

    // 14. Create useful indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_song_collaborators_songId" ON "song_collaborators" ("songId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_song_collaborators_email" ON "song_collaborators" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse is complex - you'd need to recreate the collaborators table
    // For simplicity, just fail the down migration
    throw new Error(
      'Cannot reverse this migration - data structure fundamentally changed',
    );
  }
}
