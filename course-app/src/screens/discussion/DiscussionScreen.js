import React from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import DiscussionMobile from '../../components/course/DiscussionMobile';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const DiscussionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId, isEnrolled } = route.params || {};
  const user = useSelector(state => state.auth.user);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Thảo luận khóa học</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <DiscussionMobile courseId={courseId} isEnrolled={isEnrolled} user={user} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default DiscussionScreen;