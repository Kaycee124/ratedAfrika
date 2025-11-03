import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * This migration inserts records into the migrations table for migrations
 * that have already been applied to the database but are not tracked.
 * 
 * Use this ONLY if your database schema is up to date but the migrations
 * table is empty or missing records.
 * 
 * TO USE: Temporarily rename this file to have an earlier timestamp than
 * your other migrations (e.g., 0000000000000-InsertMigrationRecords.ts)
 * and run it once, then delete or rename it back.
 */
export class InsertMigrationRecords0000000000000
  implements MigrationInterface
{
  name = 'InsertMigrationRecords0000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if migrations table has any records
    const existingMigrations = await queryRunner.query(
      `SELECT COUNT(*) as count FROM migrations`,
    );

    const count = parseInt(existingMigrations[0].count);

    if (count > 0) {
      console.log(
        `Migrations table already has ${count} records. Skipping insertion.`,
      );
      return;
    }

    console.log('Migrations table is empty. Inserting migration records...');

    // List of all migrations that have already been applied to the database
    // Adjust this list based on which migrations are actually in your database
    const appliedMigrations = [
      {
        timestamp: 1710000000000,
        name: 'AddRecipientNameToSplitSheetEntry1710000000000',
      },
      {
        timestamp: 1710000000001,
        name: 'AddInvalidationFieldsToSplitSheets1710000000001',
      },
      { timestamp: 1740759006921, name: 'Migration1740759006921' },
      {
        timestamp: 1748400000000,
        name: 'AddSplitSheetVersioning1748400000000',
      },
      { timestamp: 1750140258275, name: 'Migration1750140258275' },
      { timestamp: 1758377323914, name: 'Migration1758377323914' },
      {
        timestamp: 1758377323915,
        name: 'AddRatedFansCustomization1758377323915',
      },
      { timestamp: 1758582553639, name: 'Migration1758582553639' },
      { timestamp: 1759228290252, name: 'Migration1759228290252' },
      { timestamp: 1761218836848, name: 'Migration1761218836848' },
    ];

    // Insert each migration record
    for (const migration of appliedMigrations) {
      await queryRunner.query(
        `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
        [migration.timestamp, migration.name],
      );
      console.log(`✓ Inserted migration record: ${migration.name}`);
    }

    console.log(
      '\n✅ All migration records inserted successfully!',
    );
    console.log(
      'The UpdateSubscriptionPlans migration will run next as a new migration.\n',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Rolling back inserted migration records...');

    const migrationsToRemove = [
      'AddRecipientNameToSplitSheetEntry1710000000000',
      'AddInvalidationFieldsToSplitSheets1710000000001',
      'Migration1740759006921',
      'AddSplitSheetVersioning1748400000000',
      'Migration1750140258275',
      'Migration1758377323914',
      'AddRatedFansCustomization1758377323915',
      'Migration1758582553639',
      'Migration1759228290252',
      'Migration1761218836848',
    ];

    for (const name of migrationsToRemove) {
      await queryRunner.query(`DELETE FROM migrations WHERE name = $1`, [
        name,
      ]);
      console.log(`✓ Removed migration record: ${name}`);
    }
  }
}

