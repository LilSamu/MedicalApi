import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/environment';

export interface AuthRequest extends Request {
    userId?: number;
    userRole?: 'patient' | 'doctor' | 'admin';
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.sendStatus(401);
        return;
    }

    const token = authHeader.substring('Bearer '.length);

    try {
        const payload = jwt.verify(token, config.user_sessions.secret) as { id: number; role: 'patient' | 'doctor' | 'admin' };
        req.userId = payload.id;
        req.userRole = payload.role;
        next();
    } catch (e) {
        res.sendStatus(401);
        return;
    }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    if (req.userRole !== 'admin') {
        res.sendStatus(401);
        return;
    }
    next();
}

export function doctorMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    if (req.userRole !== 'doctor') {
        res.sendStatus(401);
        return;
    }
    next();
}

export function patientMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    if (req.userRole !== 'patient') {
        res.sendStatus(401);
        return;
    }
    next();
}
