import { json, urlencoded } from 'body-parser';
import { Application } from 'express';
import { Service } from 'typedi';

import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { Api } from './api/api';
import { config } from '../config/environment';

@Service()
export class Server {

    app: Application;

    constructor(private readonly api: Api) {
        this.app = express();
        this.setupServer();
    }

    private setupServer(): void {
        this.app.use(cors());
        this.app.use(json({ limit: '5mb' }));
        this.app.use(urlencoded({ extended: false }));
        this.app.use(morgan('dev'));

        this.app.use('/api', this.api.getApiRouter());

        this.app.listen(config.port, this.onHttpServerListening);
    }

    private onHttpServerListening(): void {
        console.log(`Server express started in ${config.env} mode (ip:${config.ip}, port:${config.port})`);
    }

}
