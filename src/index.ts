import "reflect-metadata";
import { Container } from 'typedi';
import { DatabaseService } from './database/database.service';
import { Server } from "./server/server";

async function init(): Promise<void> {
    const databaseService = Container.get(DatabaseService);
    await databaseService.initializeDatabase();

    Container.get(Server);
}

(async () => {
    await init();
})();
