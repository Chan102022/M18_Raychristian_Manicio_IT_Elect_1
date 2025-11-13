import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { createUser, getUserByEmail, initDatabase } from '../utils/database';
import { comparePassword, hashPassword, validateEmail, validatePassword } from '../utils/passwordUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  // Initialize database and check for existing session
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize database
        await initDatabase();
        setIsDbInitialized(true);

        // Check for existing session
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Register new user
  const register = async (email, password, confirmPassword) => {
    try {
      // Validate email
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors[0]);
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user in database
      await createUser(email, hashedPassword);

      // Auto login after registration
      const newUser = await getUserByEmail(email);
      const userData = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      };

      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      // Validate email
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!password) {
        throw new Error('Please enter your password');
      }

      // Get user from database
      const dbUser = await getUserByEmail(email);

      if (!dbUser) {
        throw new Error('Invalid email or password');
      }

      // Compare passwords
      const isPasswordValid = await comparePassword(password, dbUser.password);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Set user data
      const userData = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role
      };

      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isLoading,
    isDbInitialized,
    isAuthenticated: !!user,
    register,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
