import Dexie, {Table} from 'dexie';
import {Log} from './models';

/**
 * Define database class
 */
class ClientLogDb extends Dexie {

    // Define tables
    logs!: Table<Log>

    constructor() {
        super('client-log');

        // Define tables
        this.version(1).stores({
            logs: 'uuid, timestamp'
        });
    }

}

export const db = new ClientLogDb();

