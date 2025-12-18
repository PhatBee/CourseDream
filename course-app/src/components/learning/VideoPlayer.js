import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview'; // Cần cài: npx expo install react-native-webview
import { Image } from 'expo-image';
import { getVideoSource } from '../../utils/videoUtils';

const VideoPlayer = ({ currentLecture, thumbnail }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Nếu chưa chọn bài học -> Hiện Thumbnail khóa học
  if (!currentLecture) {
    return (
      <View className="w-full h-56 bg-black justify-center items-center">
        <Image 
            source={thumbnail ? { uri: thumbnail.url || thumbnail } : null} 
            style={StyleSheet.absoluteFill} 
            contentFit="cover" 
            className="opacity-60"
        />
        <View className="bg-rose-500 px-6 py-3 rounded-full">
            <Text className="text-white font-bold">Select a lecture to start</Text>
        </View>
      </View>
    );
  }

  // Lấy nguồn video đã xử lý
  const { type, uri } = getVideoSource(currentLecture.videoUrl);

  if (!uri) {
     return (
        <View className="w-full h-56 bg-gray-900 justify-center items-center">
            <Text className="text-white">Video not available</Text>
        </View>
     );
  }

  // === TRƯỜNG HỢP 1: Video YouTube/Vimeo (Dùng WebView) ===
  if (type === 'webview') {
    return (
      <View className="w-full h-56 bg-black">
        <WebView
          style={{ flex: 1 }}
          source={{ uri: uri }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsFullscreenVideo={true}
          startInLoadingState={true}
          renderLoading={() => (
             <View className="absolute inset-0 justify-center items-center bg-black">
                <ActivityIndicator color="#e11d48" />
             </View>
          )}
        />
      </View>
    );
  }

  // === TRƯỜNG HỢP 2: Video MP4 Cloudinary (Dùng expo-av) ===
  return (
    <View className="w-full h-56 bg-black">
      <Video
        ref={videoRef}
        style={StyleSheet.absoluteFill}
        source={{ uri: uri }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
        onPlaybackStatusUpdate={status => setStatus(() => status)}
        shouldPlay={true}
      />
    </View>
  );
};

export default VideoPlayer;