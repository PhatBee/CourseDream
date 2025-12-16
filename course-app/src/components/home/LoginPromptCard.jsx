import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowRight, BookOpen, Award, Users } from 'lucide-react-native';

const LoginPromptCard = ({ navigation }) => {
    return (
        <View className="bg-rose-500 rounded-3xl p-6 mb-6 shadow-lg">
            <View className="mb-4">
                <Text className="text-white text-2xl font-bold mb-2">
                    Start Your Learning Journey! 🚀
                </Text>
                <Text className="text-white/90 text-sm">
                    Sign in to access exclusive courses, track your progress, and earn certificates
                </Text>
            </View>

            {/* Benefits */}
            <View className="space-y-2 mb-5">
                <View className="flex-row items-center gap-2 mb-2">
                    <BookOpen size={16} color="#fff" />
                    <Text className="text-white text-sm">Access 1000+ premium courses</Text>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                    <Award size={16} color="#fff" />
                    <Text className="text-white text-sm">Earn verified certificates</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <Users size={16} color="#fff" />
                    <Text className="text-white text-sm">Join our learning community</Text>
                </View>
            </View>

            {/* CTA Buttons */}
            <View className="flex-row gap-3">
                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 bg-white px-4 py-3 rounded-full"
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text className="text-rose-500 font-bold text-sm">Sign In</Text>
                    <ArrowRight size={16} color="#f43f5e" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 bg-white/20 px-4 py-3 rounded-full border border-white/30"
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text className="text-white font-bold text-sm">Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default LoginPromptCard;
