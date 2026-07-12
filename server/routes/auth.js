import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const router = express.Router();

// ==========================================
// 1. SIGN UP ROUTE (CREATES USER IN XAMPP)
// ==========================================
router.post('/signup', async (req, res) => {
  try {
    console.log("📥 SIGNUP DATA RECEIVED:", req.body);
    const { email, password, full_name, phone, role } = req.body; // role should be 'tenant', 'landlord', or 'admin'

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Check if user already exists in XAMPP
    const [existingUsers] = await pool.query('SELECT * FROM profiles WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate a simple unique ID to replace Supabase UUID
    const userId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Hash password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into XAMPP profiles table
    await pool.query(`
      INSERT INTO profiles (id, email, full_name, phone, password)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, email, full_name || null, phone || null, hashedPassword]);

    // Insert into user_roles table
    const assignedRole = role || 'tenant'; // defaults to tenant if none selected
    await pool.query(`
      INSERT INTO user_roles (user_id, role)
      VALUES (?, ?)
    `, [userId, assignedRole]);

    console.log(`✅ Automatically created new user: ${email} with role ${assignedRole}`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Please log in.',
    });

  } catch (error) {
    console.error('XAMPP Signup Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// ==========================================
// 2. LOGIN ROUTE (READS USER FROM XAMPP)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    console.log("📥 LOGIN DATA RECEIVED:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Fetch user and join their role
    const [rows] = await pool.query(`
      SELECT p.*, r.role 
      FROM profiles p
      LEFT JOIN user_roles r ON p.id = r.user_id
      WHERE p.email = ?
    `, [email]);
    
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare hashed password (with plain-text presentation safety net fallback)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && password !== user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'presentation_secret_key',
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'tenant'
      }
    });

  } catch (error) {
    console.error('XAMPP Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;