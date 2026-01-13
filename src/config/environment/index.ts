import { merge } from 'lodash';

import { development } from './development';
import { test } from './test';

const all = {
    env: process.env.NODE_ENV,
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    ip: process.env.IP || '0.0.0.0',
    user_sessions: {
        // Token secreto para la encriptación de los JWT
        secret: 'medical-api-secret-key-2024.secure.jwt.token',
        // Número de días a los que expirará la sesión
        expiration_days: 7,
    },
};

export const config: any = merge(all, _getEnvironmentConfig());

function _getEnvironmentConfig() {
    if (process.env.NODE_ENV === 'development') {
        return development;
    } else if (process.env.NODE_ENV === 'test') {
        return test;
    } else {
        return {};
    }
}
