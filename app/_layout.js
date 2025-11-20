import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootNavigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments(); // ex: ["login"], ["(tabs)", "index"]
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const current = segments[0]; // first segment

    const isAuthScreen =
      current === "login" ||
      current === "register" ||
      current === "forgot-password";

    if (!isAuthenticated && !isAuthScreen) {
      router.replace("/login");
    } else if (isAuthenticated && isAuthScreen) {
      router.replace("/(tabs)/");
    }
  }, [segments, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="(tabs)" /> {/* Tab navigator */}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
});
