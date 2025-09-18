import React from "react";
import { View, Text, StyleSheet } from "react-native";
import CounterApp from "./CounterApp";
import ColorChangerApp from "./ColorChangerApp";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My First Project</Text>
      <CounterApp />
      <ColorChangerApp />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: "bold",
  },
});
