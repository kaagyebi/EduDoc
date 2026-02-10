import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'edtech-dashboard-secret-key-2024';

// Simple token generation (base64 encoded JSON with expiry)
export function generateToken(adminId, username) {
    const payload = {
        id: adminId,
        username: username,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(token).digest('hex');
    return `${token}.${signature}`;
}

// Verify token
export function verifyToken(token) {
    try {
        const [payload, signature] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
        
        if (signature !== expectedSig) {
            return null;
        }
        
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        
        if (decoded.exp < Date.now()) {
            return null; // Token expired
        }
        
        return decoded;
    } catch (error) {
        return null;
    }
}

// Auth middleware
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.admin = decoded;
    next();
}
