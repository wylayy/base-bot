import { Knex } from 'knex';
export declare let db: Knex;
export declare const initDatabase: () => Promise<Knex>;
