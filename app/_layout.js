import { Stack, Tabs, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthScreen = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'forgot-password';

    if (!isAuthenticated && !inAuthScreen) {
      // Redirect to login if not authenticated and not in auth screens
      router.replace('/login');
    } else if (isAuthenticated && inAuthScreen) {
      // Redirect to home if authenticated and trying to access auth screens
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!isAuthenticated) {
    // Show auth screens
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    );
  }

  // Show main app tabs
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1e1e1e',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="messenger"
        options={{
          title: 'Messenger',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="comments"
        options={{
          title: 'Comments',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="forgot-password"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

//this is the App.js alternative for expo-router on my Midterm Activity 1
