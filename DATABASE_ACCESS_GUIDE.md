# Database Access Guide - React Native SQLite

## 🗄️ Overview

Your React Native app uses **SQLite** (via `expo-sqlite`) for local data storage. The database is initialized when the app starts and provides user authentication functionality.

---

## 📁 Database File Location

- **File**: `utils/database.js`
- **Database Name**: `auth.db`
- **Storage**: Local device storage (persistent across app restarts)

---

## 🔧 How to Access the Database

### Method 1: Import Database Functions (Recommended)

```javascript
import {
  initDatabase,
  getDatabase,
  createUser,
  getUserByEmail,
  updateUserPassword,
  saveResetToken,
  verifyResetToken,
  clearResetToken,
  getAllUsers,
} from "../utils/database";
```

### Method 2: Direct Database Instance

```javascript
import { getDatabase } from "../utils/database";

// Get the database instance
const db = getDatabase();

// Run custom queries
const result = await db.runAsync("SELECT * FROM users WHERE role = ?", [
  "admin",
]);
```

---

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  resetToken TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**

- `id`: Auto-incrementing primary key
- `email`: Unique user email (lowercase)
- `password`: Hashed password (never store plain text!)
- `role`: User role (default: 'user')
- `resetToken`: Temporary token for password reset
- `createdAt`: Timestamp of account creation

---

## 🛠️ Available Database Functions

### 1. Initialize Database

**Function**: `initDatabase()`

**Purpose**: Creates the database and tables if they don't exist

**Usage**:

```javascript
import { initDatabase } from "../utils/database";

// Initialize database (called automatically in AuthContext)
await initDatabase();
```

**When to use**:

- Automatically called when app starts (in `AuthContext.js`)
- Only needs to be called once

---

### 2. Get Database Instance

**Function**: `getDatabase()`

**Purpose**: Returns the active database connection

**Usage**:

```javascript
import { getDatabase } from "../utils/database";

const db = getDatabase();

// Now you can run custom queries
const users = await db.getAllAsync("SELECT * FROM users");
```

**Important**: Must call `initDatabase()` first, or it will throw an error

---

### 3. Create User

**Function**: `createUser(email, hashedPassword)`

**Purpose**: Adds a new user to the database

**Parameters**:

- `email` (string): User's email address
- `hashedPassword` (string): Pre-hashed password

**Usage**:

```javascript
import { createUser } from "../utils/database";
import { hashPassword } from "../utils/passwordUtils";

// Hash the password first
const hashedPassword = await hashPassword("myPassword123");

// Create the user
const result = await createUser("user@example.com", hashedPassword);
console.log("User created with ID:", result.lastInsertRowId);
```

**Returns**: Result object with `lastInsertRowId`

**Errors**: Throws error if email already exists

---

### 4. Get User by Email

**Function**: `getUserByEmail(email)`

**Purpose**: Retrieves a user's data by email

**Parameters**:

- `email` (string): User's email address

**Usage**:

```javascript
import { getUserByEmail } from "../utils/database";

const user = await getUserByEmail("user@example.com");

if (user) {
  console.log("User found:", user);
  console.log("User ID:", user.id);
  console.log("Email:", user.email);
  console.log("Role:", user.role);
  console.log("Created:", user.createdAt);
} else {
  console.log("User not found");
}
```

**Returns**: User object or `null` if not found

---

### 5. Update User Password

**Function**: `updateUserPassword(email, newHashedPassword)`

**Purpose**: Changes a user's password

**Parameters**:

- `email` (string): User's email address
- `newHashedPassword` (string): New hashed password

**Usage**:

```javascript
import { updateUserPassword } from "../utils/database";
import { hashPassword } from "../utils/passwordUtils";

// Hash the new password
const newHashedPassword = await hashPassword("newPassword123");

// Update the password
await updateUserPassword("user@example.com", newHashedPassword);
console.log("Password updated successfully");
```

**Returns**: `true` on success

---

### 6. Save Reset Token

**Function**: `saveResetToken(email, token)`

**Purpose**: Stores a password reset token for a user

**Parameters**:

- `email` (string): User's email address
- `token` (string): Reset token

**Usage**:

```javascript
import { saveResetToken } from "../utils/database";
import { generateResetToken } from "../utils/passwordUtils";

// Generate a token
const token = generateResetToken();

// Save it to the database
await saveResetToken("user@example.com", token);
console.log("Reset token saved:", token);
```

**Returns**: `true` on success

---

### 7. Verify Reset Token

**Function**: `verifyResetToken(email, token)`

**Purpose**: Checks if a reset token is valid for a user

**Parameters**:

- `email` (string): User's email address
- `token` (string): Token to verify

**Usage**:

```javascript
import { verifyResetToken } from "../utils/database";

const isValid = await verifyResetToken("user@example.com", "ABC123");

if (isValid) {
  console.log("Token is valid");
} else {
  console.log("Token is invalid");
}
```

**Returns**: `true` if valid, `false` if invalid

---

### 8. Clear Reset Token

**Function**: `clearResetToken(email)`

**Purpose**: Removes the reset token after password reset

**Parameters**:

- `email` (string): User's email address

**Usage**:

```javascript
import { clearResetToken } from "../utils/database";

await clearResetToken("user@example.com");
console.log("Reset token cleared");
```

**Returns**: `true` on success

---

### 9. Get All Users (Debug)

**Function**: `getAllUsers()`

**Purpose**: Retrieves all users (without passwords)

**Usage**:

```javascript
import { getAllUsers } from "../utils/database";

const users = await getAllUsers();
console.log("All users:", users);

users.forEach((user) => {
  console.log(`${user.email} - ${user.role} - Created: ${user.createdAt}`);
});
```

**Returns**: Array of user objects (without password field)

**Note**: For debugging only - don't use in production

---

## 💡 Complete Example: Custom Database Query

```javascript
import { getDatabase } from "../utils/database";

async function getAdminUsers() {
  try {
    const db = getDatabase();

    // Get all admin users
    const admins = await db.getAllAsync(
      "SELECT id, email, createdAt FROM users WHERE role = ?",
      ["admin"]
    );

    console.log("Admin users:", admins);
    return admins;
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw error;
  }
}

// Usage
const admins = await getAdminUsers();
```

---

## 🔐 Security Best Practices

### ✅ DO:

- Always hash passwords before storing
- Use parameterized queries (prevents SQL injection)
- Validate email format before database operations
- Handle errors gracefully
- Clear sensitive data after use

### ❌ DON'T:

- Never store plain text passwords
- Don't expose password hashes to users
- Don't trust user input without validation
- Don't use string concatenation for queries

---

## 🧪 Testing Database Access

### Test 1: Check Database Initialization

```javascript
import { initDatabase, getDatabase } from "../utils/database";

async function testDatabaseInit() {
  try {
    await initDatabase();
    const db = getDatabase();
    console.log("✅ Database initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return false;
  }
}
```

### Test 2: Create and Retrieve User

```javascript
import { createUser, getUserByEmail } from "../utils/database";
import { hashPassword } from "../utils/passwordUtils";

async function testUserOperations() {
  try {
    // Create user
    const hashedPassword = await hashPassword("test123");
    await createUser("test@example.com", hashedPassword);
    console.log("✅ User created");

    // Retrieve user
    const user = await getUserByEmail("test@example.com");
    console.log("✅ User retrieved:", user.email);

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}
```

### Test 3: Password Reset Flow

```javascript
import {
  saveResetToken,
  verifyResetToken,
  clearResetToken,
} from "../utils/database";
import { generateResetToken } from "../utils/passwordUtils";

async function testPasswordReset() {
  try {
    const email = "test@example.com";

    // Generate and save token
    const token = generateResetToken();
    await saveResetToken(email, token);
    console.log("✅ Token saved");

    // Verify token
    const isValid = await verifyResetToken(email, token);
    console.log("✅ Token verified:", isValid);

    // Clear token
    await clearResetToken(email);
    console.log("✅ Token cleared");

    return true;
  } catch (error) {
    console.error("❌ Test failed:", error);
    return false;
  }
}
```

---

## 🔍 Debugging Database Issues

### View Database Contents

```javascript
import { getAllUsers } from "../utils/database";

async function debugDatabase() {
  const users = await getAllUsers();
  console.log("=== DATABASE CONTENTS ===");
  console.log(`Total users: ${users.length}`);
  users.forEach((user, index) => {
    console.log(`\nUser ${index + 1}:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Created: ${user.createdAt}`);
  });
}
```

### Check Database Connection

```javascript
import { getDatabase } from "../utils/database";

function checkDatabaseConnection() {
  try {
    const db = getDatabase();
    console.log("✅ Database connection active");
    return true;
  } catch (error) {
    console.error("❌ Database not initialized:", error.message);
    return false;
  }
}
```

---

## 📱 Where Database is Used in Your App

### 1. AuthContext (`context/AuthContext.js`)

- Initializes database on app start
- Creates users during registration
- Retrieves users during login
- Manages user sessions

### 2. Login Screen (`app/login.js`)

- Uses `getUserByEmail()` via AuthContext
- Verifies user credentials

### 3. Register Screen (`app/register.js`)

- Uses `createUser()` via AuthContext
- Creates new user accounts

### 4. Forgot Password Screen (`app/forgot-password.js`)

- Uses `getUserByEmail()` to verify email
- Uses `saveResetToken()` to store reset token
- Uses `verifyResetToken()` to validate token
- Uses `updateUserPassword()` to change password
- Uses `clearResetToken()` after reset

---

## 🚀 Quick Start Guide

### Step 1: Import What You Need

```javascript
import { getUserByEmail, createUser } from "../utils/database";
```

### Step 2: Use the Functions

```javascript
// Get a user
const user = await getUserByEmail("user@example.com");

// Create a user
await createUser("new@example.com", hashedPassword);
```

### Step 3: Handle Errors

```javascript
try {
  const user = await getUserByEmail("user@example.com");
  if (user) {
    console.log("User found:", user);
  } else {
    console.log("User not found");
  }
} catch (error) {
  console.error("Database error:", error);
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Check if Email Exists

```javascript
async function emailExists(email) {
  const user = await getUserByEmail(email);
  return user !== null;
}
```

### Use Case 2: Count Total Users

```javascript
async function getTotalUsers() {
  const users = await getAllUsers();
  return users.length;
}
```

### Use Case 3: Get User Role

```javascript
async function getUserRole(email) {
  const user = await getUserByEmail(email);
  return user ? user.role : null;
}
```

---

## 📞 Need Help?

If you encounter issues:

1. **Check if database is initialized**: Look for "Database initialized successfully" in console
2. **Verify imports**: Make sure you're importing from the correct path
3. **Check for errors**: Look at console logs for error messages
4. **Test with simple queries**: Start with `getAllUsers()` to verify connection

---

## ✅ Navigation Fix Applied

I've fixed the navigation issue that was preventing access to the register and forgot-password screens. The app should now properly allow navigation between:

- Login screen
- Register screen
- Forgot Password screen

**What was fixed**: Changed the auth screen detection from checking for an `(auth)` group to checking for individual screen names (`login`, `register`, `forgot-password`).

**Test it now**: Try clicking "Sign Up" or "Forgot Password?" on the login screen - they should work properly!

---

**Happy Coding! 🎉**
