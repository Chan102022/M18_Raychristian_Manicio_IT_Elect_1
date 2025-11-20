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

  // Initialize database and check session
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        setIsDbInitialized(true);

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

  // REGISTER — now supports profileImage
  const register = async (email, password, confirmPassword, profileImage) => {
    try {
      // Validation
      if (!validateEmail(email)) throw new Error('Please enter a valid email address');

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) throw new Error(passwordValidation.errors[0]);

      if (password !== confirmPassword) throw new Error('Passwords do not match');

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user in DB (NOW includes profileImage)
      await createUser(email, hashedPassword, profileImage);

      // Auto-login after registration
      const newUser = await getUserByEmail(email);
      const userData = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        profile_image: newUser.profile_image,
      };

      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // LOGIN — also returns profile_image now
  const login = async (email, password) => {
    try {
      if (!validateEmail(email)) throw new Error('Please enter a valid email address');
      if (!password) throw new Error('Please enter your password');

      const dbUser = await getUserByEmail(email);
      if (!dbUser) throw new Error('Invalid email or password');

      const isPasswordValid = await comparePassword(password, dbUser.password);
      if (!isPasswordValid) throw new Error('Invalid email or password');

      const userData = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        profile_image: dbUser.profile_image,
      };

      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

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
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
