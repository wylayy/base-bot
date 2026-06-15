import { Knex } from 'knex';
export default class PluginMigrationSource implements Knex.MigrationSource<string> {
    private migrationsPath;
    private pluginKey;
    constructor(migrationsPath: string, pluginKey: string);
    getMigrations(): Promise<string[]>;
    getMigrationName(migration: string): string;
    getMigration(migration: string): Promise<any>;
}
