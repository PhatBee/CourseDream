import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

const MyCoursesScreen = ({ navigation }) => {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold">My Courses</Text>
            </View>

            <View className="flex-1 items-center justify-center px-6">
                <Text className="text-gray-600 text-center">
                    My Courses screen is coming soon!
                </Text>
            </View>
        </SafeAreaView>
    );
};

export default MyCoursesScreen;
