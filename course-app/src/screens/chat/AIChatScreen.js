import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, Send } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import EventSource from 'react-native-sse';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api'; // Dùng IP mặc định của Android Emulator nếu không có biến môi trường

const AIChatScreen = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Xin chào! Mình là trợ lý AI của CourseDream. Bạn đang muốn tìm khóa học về chủ đề gì?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();
  const navigation = useNavigation();

  // Tự động scroll xuống cuối
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const typingQueueRef = useRef('');
  const isTypingRef = useRef(false);
  const isStreamDoneRef = useRef(false);
  const pendingCoursesRef = useRef(null);
  const aiMessageIndexRef = useRef(-1);

  const processTypingQueue = () => {
    if (typingQueueRef.current.length > 0) {
      const chars = typingQueueRef.current.slice(0, 2);
      typingQueueRef.current = typingQueueRef.current.slice(2);

      setMessages(prev => {
        const newMsgs = [...prev];
        const idx = aiMessageIndexRef.current;
        if (newMsgs[idx]) {
          newMsgs[idx] = { ...newMsgs[idx], text: newMsgs[idx].text + chars };
        }
        return newMsgs;
      });

      requestAnimationFrame(() => {
        setTimeout(processTypingQueue, 15);
      });
    } else {
      isTypingRef.current = false;
      if (isStreamDoneRef.current && pendingCoursesRef.current) {
        const finalCourses = pendingCoursesRef.current;
        pendingCoursesRef.current = null;
        setMessages(prev => {
          const newMsgs = [...prev];
          const idx = aiMessageIndexRef.current;
          if (newMsgs[idx] && (!newMsgs[idx].courses || newMsgs[idx].courses.length === 0)) {
            newMsgs[idx] = { ...newMsgs[idx], courses: finalCourses };
          }
          return newMsgs;
        });
      }
    }
  };

  const startTypingEffect = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      processTypingQueue();
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const currentMessages = [...messages, { role: 'user', text: userText }];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    const aiMessageIndex = currentMessages.length;
    aiMessageIndexRef.current = aiMessageIndex;

    // Reset state
    typingQueueRef.current = '';
    isTypingRef.current = false;
    isStreamDoneRef.current = false;
    pendingCoursesRef.current = null;

    // Chuẩn bị khung message rỗng cho AI
    setMessages(prev => [...prev, { role: 'ai', text: '', courses: [] }]);

    // Kết nối Server-Sent Events (SSE)
    const es = new EventSource(`${API_URL}/chatbot/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userText, history: currentMessages }),
    });

    es.addEventListener('message', (event) => {
      if (event.data === '[DONE]') {
        es.close();
        isStreamDoneRef.current = true;
        if (!isTypingRef.current) {
          processTypingQueue();
        }
        return;
      }
      
      try {
        const data = JSON.parse(event.data);
        setIsLoading(false); // Đã nhận dữ liệu đầu tiên

        if (data.type === 'courses') {
          pendingCoursesRef.current = data.courses;
        } else if (data.type === 'text') {
          typingQueueRef.current += data.text;
          startTypingEffect();
        }
      } catch (e) {
        console.error("Lỗi parse SSE", e);
      }
    });

    es.addEventListener('error', (err) => {
      console.error("SSE Error:", err);
      setIsLoading(false);
      es.close();
      setMessages(prev => {
        const newMsgs = [...prev];
        if (!newMsgs[aiMessageIndex].text) {
           newMsgs[aiMessageIndex] = { role: 'ai', text: 'Hệ thống đang bận. Vui lòng thử lại sau.' };
        }
        return newMsgs;
      });
    });
  };

  const renderCourseCard = (course) => (
    <TouchableOpacity
      key={course._id}
      style={styles.courseCard}
      onPress={() => navigation.navigate('CourseDetail', { slug: course.slug, courseId: course._id })}
    >
      <Image source={{ uri: course.thumbnail }} style={styles.courseImage} />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.coursePrice}>
          {course.price > 0 ? course.price.toLocaleString() + 'đ' : 'Miễn phí'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Bot size={28} color="#fff" />
        <Text style={styles.headerTitle}>Trợ lý AI CourseDream</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((msg, index) => (
            <View key={index} style={[styles.messageWrapper, msg.role === 'user' ? styles.messageUser : styles.messageAI]}>
              {msg.text ? (
                <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                  {msg.role === 'ai' ? (
                     <Markdown style={markdownStyles}>{msg.text}</Markdown>
                  ) : (
                     <Text style={styles.textUser}>{msg.text}</Text>
                  )}
                </View>
              ) : null}

              {msg.courses && msg.courses.length > 0 && (
                <View style={styles.courseContainer}>
                  {msg.courses.map(renderCourseCard)}
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageWrapper, styles.messageAI]}>
              <View style={[styles.bubble, styles.bubbleAI, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#e11d48" />
                <Text style={{ marginLeft: 8, color: '#6b7280' }}>Đang nghĩ...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Hỏi trợ lý tư vấn khóa học..."
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#e11d48',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 16,
  },
  messageWrapper: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  messageUser: {
    alignSelf: 'flex-end',
  },
  messageAI: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: '#e11d48',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderBottomLeftRadius: 4,
  },
  textUser: {
    color: '#fff',
    fontSize: 15,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseContainer: {
    marginTop: 8,
    gap: 8,
    width: 250,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 8,
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  courseImage: {
    width: 70,
    height: 50,
    borderRadius: 4,
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  courseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  coursePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#e11d48',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

const markdownStyles = {
  body: {
    color: '#1f2937',
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  strong: {
    fontWeight: 'bold',
    color: '#000',
  },
  em: {
    fontStyle: 'italic',
  },
  bullet_list: {
    marginLeft: 0,
    marginTop: 0,
  },
  ordered_list: {
    marginLeft: 0,
    marginTop: 0,
  },
};

export default AIChatScreen;
