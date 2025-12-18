import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { ChevronDown, ChevronUp, PlayCircle, Lock } from 'lucide-react-native';
import { Video } from 'expo-video';
import { WebView } from 'react-native-webview';

const isYouTube = url => /youtube\.com|youtu\.be/.test(url);
const isDailymotion = url => /dailymotion\.com|dai\.ly/.test(url);

const getEmbedUrl = (url) => {
  if (/dai\.ly\/([a-zA-Z0-9]+)/.test(url)) {
    const id = url.match(/dai\.ly\/([a-zA-Z0-9]+)/)[1];
    return `https://www.dailymotion.com/embed/video/${id}`;
  }
  if (/dailymotion\.com\/video\/([a-zA-Z0-9]+)/.test(url)) {
    const id = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/)[1];
    return `https://www.dailymotion.com/embed/video/${id}`;
  }
  if (/youtu\.be\/([a-zA-Z0-9_-]+)/.test(url)) {
    const id = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)[1];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (/youtube\.com.*[?&]v=([a-zA-Z0-9_-]+)/.test(url)) {
    const id = url.match(/v=([a-zA-Z0-9_-]+)/)[1];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url;
};

const CourseAccordionMobile = ({ sections = [] }) => {
  const [openSection, setOpenSection] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  return (
    <View className="px-4 mb-4">
      <Text className="font-bold text-base mb-2 text-sky-600">📚 Course Content</Text>
      {sections.map((section, idx) => (
        <View
          key={section._id || idx}
          className="mb-3 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
        >
          <TouchableOpacity
            className="flex-row items-center px-4 py-3 justify-between bg-gray-100"
            onPress={() => setOpenSection(openSection === idx ? null : idx)}
            activeOpacity={0.8}
          >
            <Text className="font-bold text-base flex-1">{section.title}</Text>
            {openSection === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </TouchableOpacity>
          {openSection === idx && section.lectures && (
            <View className="py-2 bg-white">
              {section.lectures.map((lec, i) => (
                <View
                  key={lec._id || i}
                  className={`flex-row items-center px-4 py-2 ${i !== section.lectures.length - 1 ? 'border-b border-gray-100' : ''} bg-gray-50`}
                >
                  {lec.isPreviewFree && lec.videoUrl ? (
                    <TouchableOpacity
                      className="flex-row items-center flex-1"
                      onPress={() => setPreviewUrl(lec.videoUrl)}
                      activeOpacity={0.7}
                    >
                      <PlayCircle size={18} color="#2563eb" className="mr-2" />
                      <Text
                        className="text-sky-600 font-bold flex-1"
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {lec.title}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-row items-center flex-1">
                      <Lock size={16} color="#9ca3af" className="mr-2" />
                      <Text
                        className="text-gray-400 flex-1"
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {lec.title}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
      {/* Modal xem video preview */}
      <Modal visible={!!previewUrl} animationType="slide" onRequestClose={() => setPreviewUrl(null)}>
        <View className="flex-1 bg-black justify-center">
          {previewUrl ? (
            isYouTube(previewUrl) || isDailymotion(previewUrl) ? (
              <WebView
                source={{ uri: getEmbedUrl(previewUrl) }}
                className="w-full h-80"
                allowsFullscreenVideo
              />
            ) : (
              <Video
                source={{ uri: previewUrl }}
                useNativeControls
                className="w-full h-80"
                resizeMode="contain"
                shouldPlay
              />
            )
          ) : (
            <Text className="text-white text-center">Không có video preview</Text>
          )}
          <TouchableOpacity
            className="absolute top-10 right-5 bg-white rounded-full px-4 py-2"
            onPress={() => setPreviewUrl(null)}
          >
            <Text className="text-rose-600 font-bold">Đóng</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default CourseAccordionMobile;