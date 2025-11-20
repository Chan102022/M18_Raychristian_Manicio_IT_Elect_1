// app/(tabs)/_layout.jsx
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1e1e1e",
          borderTopColor: "#333",
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="messenger" options={{ title: "Messenger" }} />
      <Tabs.Screen name="comments" options={{ title: "Comments" }} />
    </Tabs>
  );
}
