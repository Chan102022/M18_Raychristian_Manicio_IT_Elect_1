import * as SQLite from 'expo-sqlite';

let db;

// Initialize database
export const initDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync('auth.db');

    // Create users table (UPDATED: added profile_image TEXT)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        profile_image TEXT,
        resetToken TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create messages table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sender_id) REFERENCES users(id),
        FOREIGN KEY(receiver_id) REFERENCES users(id)
      );
    `);

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Database instance
export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
};

// Create new user (UPDATED: added profile_image)
export const createUser = async (email, hashedPassword, profileImage) => {
  try {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO users (email, password, role, profile_image) VALUES (?, ?, ?, ?)',
      [email.toLowerCase(), hashedPassword, 'user', profileImage]
    );
    return result;
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// Get user by email (UPDATED: returns profile_image)
export const getUserByEmail = async (email) => {
  try {
    const db = getDatabase();
    const user = await db.getFirstAsync(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update password
export const updateUserPassword = async (email, newHashedPassword) => {
  try {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE users SET password = ? WHERE email = ?',
      [newHashedPassword, email.toLowerCase()]
    );
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// Save reset token
export const saveResetToken = async (email, token) => {
  try {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE users SET resetToken = ? WHERE email = ?',
      [token, email.toLowerCase()]
    );
    return true;
  } catch (error) {
    console.error('Error saving reset token:', error);
    throw error;
  }
};

// Verify reset token
export const verifyResetToken = async (email, token) => {
  try {
    const db = getDatabase();
    const user = await db.getFirstAsync(
      'SELECT * FROM users WHERE email = ? AND resetToken = ?',
      [email.toLowerCase(), token]
    );
    return user !== null;
  } catch (error) {
    console.error('Error verifying reset token:', error);
    throw error;
  }
};

// Clear reset token
export const clearResetToken = async (email) => {
  try {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE users SET resetToken = NULL WHERE email = ?',
      [email.toLowerCase()]
    );
    return true;
  } catch (error) {
    console.error('Error clearing reset token:', error);
    throw error;
  }
};

// Debug: Get all users (UPDATED: includes profile_image)
export const getAllUsers = async () => {
  try {
    const db = getDatabase();
    const users = await db.getAllAsync(
      'SELECT id, email, role, profile_image, createdAt FROM users'
    );
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Get all users excluding (UPDATED: includes profile_image)
export const getAllUsersExcluding = async (excludeId) => {
  try {
    const db = getDatabase();
    const users = await db.getAllAsync(
      'SELECT id, email, profile_image FROM users WHERE id != ?',
      [excludeId]
    );
    return users;
  } catch (error) {
    console.error('Error getting users excluding ID:', error);
    throw error;
  }
};

// Insert message
export const insertMessage = async (senderId, receiverId, message) => {
  try {
    const db = getDatabase();
    const result = await db.runAsync(
      'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [senderId, receiverId, message]
    );
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error inserting message:', error);
    throw error;
  }
};

// Get messages between two users
export const getMessagesBetween = async (userId1, userId2) => {
  try {
    const db = getDatabase();
    const messages = await db.getAllAsync(
      `SELECT m.id, m.sender_id, m.receiver_id, m.message, m.timestamp,
              u1.email as sender_email, u2.email as receiver_email
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) 
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.timestamp ASC`,
      [userId1, userId2, userId2, userId1]
    );
    return messages;
  } catch (error) {
    console.error('Error getting messages between users:', error);
    throw error;
  }
};
