import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export function getUserFromRequest(req: NextRequest | Request): AuthUser | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET_KEY || 'defaultSecret12345678901234567890';
    
    const decoded = jwt.verify(token, secret) as any;
    
    if (decoded && decoded.nameid) {
      return {
        id: decoded.nameid,
        email: decoded.email,
        name: decoded.name
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}
