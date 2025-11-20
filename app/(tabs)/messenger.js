import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers,
  getAllUsersExcluding,
  getMessagesBetween,
  insertMessage,
} from "../../utils/database";

export default function Messenger() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userList = await getAllUsersExcluding(user.id);
        setUsers(userList);

        if (userList.length > 0 && !selectedUser) {
          setSelectedUser(userList[0]);
        }

        // Debug
        const allUsers = await getAllUsers();
        console.log(
          "All registered users:",
          allUsers.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt,
            profile_image: u.profile_image,
          }))
        );
      } catch (error) {
        console.error("Error fetching users:", error);
        Alert.alert("Error", "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  // Fetch messages for selected user
  useEffect(() => {
    if (!user || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        setRefreshing(true);
        const dbMessages = await getMessagesBetween(user.id, selectedUser.id);

        const uiMessages = dbMessages.map((msg) => ({
          id: msg.id.toString(),
          text: msg.message,
          sender: msg.sender_id === user.id ? "me" : "other",
          timestamp: msg.timestamp,
        }));

        setMessages(uiMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setRefreshing(false);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      await insertMessage(user.id, selectedUser.id, input.trim());
      setInput("");

      const dbMessages = await getMessagesBetween(user.id, selectedUser.id);
      const uiMessages = dbMessages.map((msg) => ({
        id: msg.id.toString(),
        text: msg.message,
        sender: msg.sender_id === user.id ? "me" : "other",
        timestamp: msg.timestamp,
      }));
      setMessages(uiMessages);
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
    }
  };

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <View
        style={[
          styles.messageRow,
          item.sender === "me" ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        {/* OTHER USER AVATAR */}
        {item.sender === "other" && (
          <View style={styles.avatarContainer}>
            {selectedUser?.profile_image ? (
              <Image
                source={{ uri: selectedUser.profile_image }}
                style={styles.avatar}
              />
            ) : (
              <Ionicons
                name="person-circle"
                size={32}
                color="#999"
                style={{ marginBottom: 2 }}
              />
            )}
          </View>
        )}

        {/* MESSAGE */}
        <View
          style={[
            styles.message,
            item.sender === "me" ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
        </View>

        {/* MY AVATAR */}
        {item.sender === "me" && (
          <View style={styles.avatarContainer}>
            {user?.profile_image ? (
              <Image
                source={{ uri: user.profile_image }}
                style={styles.avatar}
              />
            ) : (
              <Ionicons
                name="person-circle"
                size={32}
                color="#999"
                style={{ marginBottom: 2 }}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || users.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            No users available. Register more users to chat.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <SafeAreaView style={styles.container}>
        {/* USER SELECTOR */}
        <View style={styles.userSelectionContainer}>
          <Text style={styles.userSelectionTitle}>Select User to Chat</Text>

          <FlatList
            horizontal
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.userItem,
                  selectedUser?.id === item.id && styles.selectedUser,
                ]}
                onPress={() => setSelectedUser(item)}
              >
                {item.profile_image ? (
                  <Image
                    source={{ uri: item.profile_image }}
                    style={styles.selectorAvatar}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={30} color="#fff" />
                )}
                <Text style={styles.userEmail}>{item.email}</Text>
              </TouchableOpacity>
            )}
            style={styles.userList}
          />
        </View>

        {/* CHAT MESSAGES */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.flatList}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        {/* INPUT */}
        {selectedUser && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#777"
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#fff", marginTop: 10 },
  userSelectionContainer: {
    padding: 10,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  userSelectionTitle: { color: "#fff", textAlign: "center", marginBottom: 10 },
  userList: { maxHeight: 70 },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    padding: 8,
    marginRight: 10,
    borderRadius: 20,
  },
  selectedUser: {
    backgroundColor: "#007AFF",
  },

  selectorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },

  userEmail: { color: "#fff", marginLeft: 5 },

  flatList: { flex: 1 },

  messageContainer: { marginVertical: 4 },
  messageRow: { flexDirection: "row", alignItems: "flex-end" },

  myMessageRow: { justifyContent: "flex-end" },
  otherMessageRow: { justifyContent: "flex-start" },

  avatarContainer: { marginHorizontal: 6 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  message: {
    padding: 10,
    borderRadius: 18,
    maxWidth: "70%",
  },
  myMessage: { backgroundColor: "#007AFF", borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: "#333", borderBottomLeftRadius: 4 },

  messageText: { color: "#fff" },

  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#1a1a1a",
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 20,
    color: "#fff",
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontWeight: "bold" },
});
