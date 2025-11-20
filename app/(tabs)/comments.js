import { useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function Comments() {
  const [posts, setPosts] = useState([
    {
      id: '1',
      title: 'First 2x2 Pic Post',
      content: 'This is my pictorial post. Comment anything nicely here!',
      image: require('../../assets/images/2x2-pic.png'),
      likes: 0,
      comments: [],
    },
    {
      id: '2',
      title: 'Beautiful Sunset',
      content: 'Caught this amazing sunset today! Nature is truly breathtaking.',
      image: require('../../assets/images/beautiful-sunset.jpg'),
      likes: 15,
      comments: [],
    },
    {
      id: '3',
      title: 'New Recipe',
      content: 'Just tried this new pasta recipe. It was delicious! 🍝',
      image: require('../../assets/images/recipe.jpg'),
      likes: 8,
      comments: [],
    },
    {
      id: '4',
      title: 'Weekend Plans',
      content: 'Anyone up for a hike this weekend? The weather looks perfect!',
      image: require('../../assets/images/weekend.jpg'),
      likes: 22,
      comments: [],
    },
  ]);
  const [commentInputs, setCommentInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const addComment = (postId) => {
    const commentText = commentInputs[postId] || '';
    if (commentText.trim() === '') return;
    const comment = {
      id: Date.now().toString(),
      text: commentText,
      replies: [],
    };
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, comments: [...post.comments, comment] }
        : post
    ));
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const addReply = (postId, commentId) => {
    if (replyText.trim() === '') return;
    const reply = {
      id: Date.now().toString(),
      text: replyText,
    };
    setPosts(posts.map(post =>
      post.id === postId
        ? {
            ...post,
            comments: post.comments.map(comment =>
              comment.id === commentId
                ? { ...comment, replies: [...comment.replies, reply] }
                : comment
            )
          }
        : post
    ));
    setReplyText('');
    setReplyingTo(null);
  };

  const toggleLike = (postId) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent}>{item.content}</Text>
      <Image source={item.image} style={styles.postImage} />
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(item.id)}>
          <Text style={styles.actionText}>👍 {item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>💬 {item.comments.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>📤 Share</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={item.comments}
        keyExtractor={(comment) => comment.id}
        renderItem={({ item: comment }) => renderComment(comment, item.id)}
        style={styles.commentsList}
        scrollEnabled={false}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={commentInputs[item.id] || ''}
          onChangeText={(text) => setCommentInputs({ ...commentInputs, [item.id]: text })}
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => addComment(item.id)}>
          <Text style={styles.sendText}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComment = (comment, postId) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentBubble}>
        <Text style={styles.commentText}>{comment.text}</Text>
        <TouchableOpacity onPress={() => setReplyingTo({ postId, commentId: comment.id })}>
          <Text style={styles.replyText}>Reply</Text>
        </TouchableOpacity>
      </View>
      {replyingTo && replyingTo.postId === postId && replyingTo.commentId === comment.id && (
        <View style={styles.replyContainer}>
          <TextInput
            style={styles.input}
            placeholder="Reply..."
            value={replyText}
            onChangeText={setReplyText}
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => addReply(postId, comment.id)}>
            <Text style={styles.sendText}>Reply</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={comment.replies}
        keyExtractor={(reply) => reply.id}
        renderItem={({ item: reply }) => (
          <View style={[styles.commentBubble, styles.replyBubble]}>
            <Text style={styles.commentText}>{reply.text}</Text>
          </View>
        )}
        style={styles.repliesList}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <SafeAreaView style={styles.container}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          style={styles.postsList}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  postsList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  postContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
    color: '#ccc',
  },
  commentsList: {
    flexGrow: 0,
  },
  commentContainer: {
    marginLeft: 20,
    marginVertical: 5,
  },
  commentBubble: {
    backgroundColor: '#555',
    borderRadius: 10,
    padding: 10,
    maxWidth: '90%',
  },
  replyBubble: {
    marginLeft: 20,
    backgroundColor: '#666',
  },
  commentText: {
    fontSize: 16,
    color: '#fff',
  },
  replyText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 5,
  },
  replyContainer: {
    flexDirection: 'row',
    marginTop: 5,
    marginLeft: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
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
  repliesList: {
    flexGrow: 0,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  actionButton: {
    padding: 5,
  },
  actionText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
