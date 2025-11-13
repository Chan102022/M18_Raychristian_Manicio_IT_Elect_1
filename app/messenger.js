import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, getAllUsersExcluding, getMessagesBetween, insertMessage } from '../utils/database';

export default function Messenger() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userList = await getAllUsersExcluding(user.id);
        setUsers(userList);
        if (userList.length > 0 && !selectedUser) {
          setSelectedUser(userList[0]); // Select first user by default
        }

        // Debug: Log all registered users
        const allUsers = await getAllUsers();
        console.log('All registered users:', allUsers.map(u => ({ id: u.id, email: u.email, role: u.role, createdAt: u.createdAt })));
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  // Fetch messages when selectedUser changes
  useEffect(() => {
    if (!user || !selectedUser) return;

    const fetchMessages = async () => {
      try {
        setRefreshing(true);
        const dbMessages = await getMessagesBetween(user.id, selectedUser.id);
        // Map DB messages to UI format
        const uiMessages = dbMessages.map((msg) => ({
          id: msg.id.toString(),
          text: msg.message,
          sender: msg.sender_id === user.id ? 'me' : 'other',
          senderEmail: msg.sender_email,
          timestamp: msg.timestamp,
          replies: [], // Flat for now, replies as separate messages
        }));
        setMessages(uiMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', 'Failed to load messages');
      } finally {
        setRefreshing(false);
      }
    };

    fetchMessages();
  }, [selectedUser, user]);

  // Poll for new messages every 5 seconds when chatting
  useEffect(() => {
    if (!selectedUser) return;

    const interval = setInterval(() => {
      // Refetch messages
      const fetchMessages = async () => {
        try {
          const dbMessages = await getMessagesBetween(user.id, selectedUser.id);
          const uiMessages = dbMessages.map((msg) => ({
            id: msg.id.toString(),
            text: msg.message,
            sender: msg.sender_id === user.id ? 'me' : 'other',
            senderEmail: msg.sender_email,
            timestamp: msg.timestamp,
            replies: [],
          }));
          setMessages(uiMessages);
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      };
      fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedUser, user]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (selectedUser) {
        // Refetch messages
        const fetchMessages = async () => {
          try {
            const dbMessages = await getMessagesBetween(user.id, selectedUser.id);
            const uiMessages = dbMessages.map((msg) => ({
              id: msg.id.toString(),
              text: msg.message,
              sender: msg.sender_id === user.id ? 'me' : 'other',
              senderEmail: msg.sender_email,
              timestamp: msg.timestamp,
              replies: [],
            }));
            setMessages(uiMessages);
          } catch (error) {
            console.error('Error refreshing messages:', error);
          }
        };
        fetchMessages();
      }
    }, [selectedUser, user])
  );

  const sendMessage = async () => {
    if (input.trim() === '' || !selectedUser) return;

    try {
      await insertMessage(user.id, selectedUser.id, input);
      setInput('');
      // Refetch messages to update UI
      const dbMessages = await getMessagesBetween(user.id, selectedUser.id);
      const uiMessages = dbMessages.map((msg) => ({
        id: msg.id.toString(),
        text: msg.message,
        sender: msg.sender_id === user.id ? 'me' : 'other',
        senderEmail: msg.sender_email,
        timestamp: msg.timestamp,
        replies: [],
      }));
      setMessages(uiMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const addReply = async (messageId, originalText) => {
    if (replyText.trim() === '' || !selectedUser) return;

    const replyContent = `Replying to: ${originalText}\n${replyText}`;
    try {
      await insertMessage(user.id, selectedUser.id, replyContent);
      setReplyText('');
      setReplyingTo(null);
      setReplyingToMessage(null);
      // Refetch messages
      const dbMessages = await getMessagesBetween(user.id, selectedUser.id);
      const uiMessages = dbMessages.map((msg) => ({
        id: msg.id.toString(),
        text: msg.message,
        sender: msg.sender_id === user.id ? 'me' : 'other',
        senderEmail: msg.sender_email,
        timestamp: msg.timestamp,
        replies: [],
      }));
      setMessages(uiMessages);
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', 'Failed to send reply');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <View style={[
        styles.messageRow,
        item.sender === 'me' ? styles.myMessageRow : styles.otherMessageRow
      ]}>
        {/* Avatar for 'other' person - shown on left */}
        {item.sender === 'other' && selectedUser && (
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={32} color="#007AFF" />
            <Text style={styles.userEmail}>{selectedUser.email}</Text>
          </View>
        )}

        {/* Message bubble */}
        <TouchableOpacity
          onPress={() => {
            if (item.sender === 'other') {
              setReplyingTo(item.id);
              setReplyingToMessage(item.text);
            }
          }}
          style={[
            styles.message,
            item.sender === 'me' ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          {item.sender === 'other' && (
            <Text style={styles.replyText}>Reply</Text>
          )}
        </TouchableOpacity>

        {/* Avatar for 'me' - shown on right */}
        {item.sender === 'me' && user && (
          <View style={styles.avatarContainer}>
            <Image
              source={require('../assets/images/2x2-pic.png')}
              style={styles.avatar}
            />
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}
      </View>

      {/* Replies - Flat for now, no nested */}
      <FlatList
        data={item.replies}
        keyExtractor={(reply) => reply.id}
        renderItem={({ item: reply }) => (
          <View style={styles.replyRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../assets/images/2x2-pic.png')}
                style={styles.avatar}
              />
            </View>
            <View style={[styles.message, styles.replyBubble]}>
              {reply.replyingTo && (
                <View style={styles.replyContext}>
                  <View style={styles.replyLine} />
                  <Text style={styles.replyContextText} numberOfLines={1}>
                    {reply.replyingTo}
                  </Text>
                </View>
              )}
              <Text style={styles.messageText}>{reply.text}</Text>
            </View>
          </View>
        )}
        style={styles.repliesList}
        scrollEnabled={false}
      />
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
          <Text style={styles.loadingText}>No users available. Register more users to chat.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <SafeAreaView style={styles.container}>
        {/* User Selection */}
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
                  selectedUser?.id === item.id ? styles.selectedUser : null
                ]}
                onPress={() => setSelectedUser(item)}
              >
                <Ionicons name="person-circle-outline" size={24} color="#007AFF" />
                <Text style={styles.userEmail}>{item.email}</Text>
              </TouchableOpacity>
            )}
            style={styles.userList}
          />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.flatList}
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 10 }}
          refreshing={refreshing}
          onRefresh={() => {
            if (selectedUser) {
              // Manual refresh
              const fetchMessages = async () => {
                try {
                  setRefreshing(true);
                  const dbMessages = await getMessagesBetween(user.id, selectedUser.id);
                  const uiMessages = dbMessages.map((msg) => ({
                    id: msg.id.toString(),
                    text: msg.message,
                    sender: msg.sender_id === user.id ? 'me' : 'other',
                    senderEmail: msg.sender_email,
                    timestamp: msg.timestamp,
                    replies: [],
                  }));
                  setMessages(uiMessages);
                } catch (error) {
                  console.error('Error refreshing:', error);
                } finally {
                  setRefreshing(false);
                }
              };
              fetchMessages();
            }
          }}
        />
        {replyingTo && (
          <View style={styles.replyContainer}>
            <View style={styles.replyingToPreview}>
              <Text style={styles.replyingToLabel}>Replying to:</Text>
              <Text style={styles.replyingToText} numberOfLines={1}>
                {replyingToMessage}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReplyingTo(null);
                  setReplyingToMessage(null);
                  setReplyText('');
                }}
                style={styles.cancelReply}
              >
                <Text style={styles.cancelReplyText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.replyInputRow}>
              <TextInput
                style={styles.input}
                placeholder="Reply..."
                value={replyText}
                onChangeText={setReplyText}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => addReply(replyingTo, replyingToMessage)}
              >
                <Text style={styles.sendText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {selectedUser && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  userSelectionContainer: {
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userSelectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  userList: {
    maxHeight: 60,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginRight: 10,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  selectedUser: {
    backgroundColor: '#007AFF',
  },
  userEmail: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  flatList: {
    flex: 1,
  },
  messageContainer: {
    marginVertical: 5,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  message: {
    padding: 10,
    borderRadius: 18,
    maxWidth: '70%',
  },
  myMessage: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#333',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  replyText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  replyContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  replyingToPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
    marginRight: 5,
  },
  replyingToText: {
    flex: 1,
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
  cancelReply: {
    padding: 5,
  },
  cancelReplyText: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyContext: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    paddingLeft: 8,
    marginBottom: 6,
    backgroundColor: '#2a2a2a',
    padding: 6,
    borderRadius: 4,
  },
  replyLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#007AFF',
  },
  replyContextText: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginRight: 40,
  },
  replyBubble: {
    backgroundColor: '#555',
    borderBottomRightRadius: 4,
  },
  repliesList: {
    flexGrow: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#333',
    color: '#fff',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 20,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
