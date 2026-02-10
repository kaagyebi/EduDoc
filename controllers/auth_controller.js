import Admin from '../models/admin_model.js';
import { generateToken } from '../middleware/auth.js';

// Login
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const admin = await Admin.findOne({ username: username.toLowerCase() });
        
        if (!admin || !admin.validPassword(password)) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = generateToken(admin._id, admin.username);

        return res.status(200).json({
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                username: admin.username
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Login failed' });
    }
};

// Verify token endpoint
export const verifyAuth = async (req, res) => {
    // If middleware passed, token is valid
    return res.status(200).json({
        valid: true,
        admin: req.admin
    });
};

// Create initial admin (run once)
export const setupAdmin = async (req, res) => {
    try {
        const existingAdmin = await Admin.findOne({});
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin already exists' });
        }

        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const admin = new Admin({ username: username.toLowerCase() });
        admin.setPassword(password);
        await admin.save();

        return res.status(201).json({ message: 'Admin created successfully' });

    } catch (error) {
        console.error('Setup error:', error);
        return res.status(500).json({ error: 'Failed to create admin' });
    }
};
