import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  // Tabs
  const [activeTab, setActiveTab] = useState('chat');

  // Profile Picture
  const [profilePic, setProfilePic] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  // Chat State
  const [messages, setMessages] = useState([
    { id: '1', text: 'Pssstt Gwapo!', sender: 'other' },
    { id: '2', text: 'Hey Nganu man??', sender: 'me' },
    { id: '3', text: 'I Lovee Youuu!', sender: 'other' },
  ]);
  const [input, setInput] = useState('');
  const chatListRef = useRef(null);

  // Comments State + Like System
  const [comments, setComments] = useState([
    { id: '1', text: 'Gwapuha nimu doy oy!' },
    { id: '2', text: 'Bitaw kagwapo bataa.' },
  ]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const commentListRef = useRef(null);

  // Toggle Like
  const toggleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  // Send Chat Message
  const sendMessage = () => {
    if (input.trim() === '') return;

    const newMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'me',
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');

    setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Add Comment
  const addComment = () => {
    if (newComment.trim() === '') return;

    const comment = {
      id: Date.now().toString(),
      text: newComment,
      replyTo: replyTo,
    };

    setComments((prev) => [...prev, comment]);
    setNewComment('');
    setReplyTo(null);

    setTimeout(() => {
      commentListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Render Chat Message
  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageRow,
        item.sender === 'me' ? styles.myRow : styles.otherRow,
      ]}
    >
      {item.sender !== 'me' && (
        <Image
          source={
            profilePic
              ? { uri: profilePic }
              : require('../assets/Screenshot 2025-11-13 165401.png')
          }
          style={styles.chatAvatar}
        />
      )}
      <View
        style={[
          styles.message,
          item.sender === 'me' ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  );

  // Render Comment
  const renderComment = ({ item }) => (
    <TouchableOpacity
      onPress={() => setReplyTo(item.text)}
      style={styles.commentBubble}
    >
      {item.replyTo && (
        <Text style={styles.replyLabel}>↪ Replying to: {item.replyTo}</Text>
      )}
      <Text style={styles.commentText}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        {/* Top Section with Editable Profile */}
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={
                profilePic
                  ? { uri: profilePic }
                  : require('../assets/Screenshot 2025-11-13 165401.png')
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <Text style={styles.profileName}>Ray Christian</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => setActiveTab('chat')}
          >
            <Text style={styles.tabText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'comments' && styles.activeTab]}
            onPress={() => setActiveTab('comments')}
          >
            <Text style={styles.tabText}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Chat Section */}
        {activeTab === 'chat' && (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={chatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={styles.flatList}
            />
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
          </View>
        )}

        {/* Post (Like + Comments Section) */}
        {activeTab === 'comments' && (
          <View style={{ flex: 1 }}>
            {/* Fake Facebook-like post */}
            <View style={styles.postContainer}>
              <Image
                source={require('../assets/Screenshot 2025-11-13 165401.png')}
                style={styles.postImage}
              />
              <View style={styles.likeContainer}>
                <TouchableOpacity onPress={toggleLike}>
                  <Text style={[styles.likeText, liked && styles.liked]}>
                    {liked ? '❤️ Liked' : '🤍 Like'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.likeCount}>{likes} Likes</Text>
              </View>
            </View>

            <FlatList
              ref={commentListRef}
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderComment}
              style={styles.flatList}
            />

            {replyTo && (
              <View style={styles.replyBox}>
                <Text style={styles.replyingText}>Replying to: {replyTo}</Text>
                <TouchableOpacity onPress={() => setReplyTo(null)}>
                  <Text style={styles.cancelReply}>✖ Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity style={styles.sendButton} onPress={addComment}>
                <Text style={styles.sendText}>
                  {replyTo ? 'Reply' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  profileContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: { borderColor: '#007AFF' },
  tabText: { fontSize: 18, fontWeight: '600' },
  flatList: { flex: 1, paddingHorizontal: 10 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 4 },
  myRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start' },
  chatAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  message: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 2,
    maxWidth: '70%',
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#EEE',
    alignSelf: 'flex-start',
  },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 20,
  },
  sendText: { color: '#fff', fontWeight: 'bold' },
  commentBubble: {
    backgroundColor: '#F1F1F1',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  commentText: { fontSize: 16, color: '#333' },
  replyLabel: { fontSize: 12, color: '#555', marginBottom: 3 },
  replyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9F0FF',
    padding: 8,
    marginHorizontal: 10,
    marginBottom: 5,
    borderRadius: 8,
    justifyContent: 'space-between',
  },
  replyingText: { fontSize: 14, color: '#333' },
  cancelReply: { fontSize: 14, color: 'red', marginLeft: 10 },
  postContainer: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  postImage: { width: '100%', height: 200 },
  likeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  likeText: { fontSize: 16, color: '#555' },
  liked: { color: 'red', fontWeight: 'bold' },
  likeCount: { fontSize: 16, color: '#333' },
});
