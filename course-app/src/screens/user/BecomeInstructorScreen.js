import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
    getInstructorApplication,
    applyToBecomeInstructor,
    reset,
} from '../../features/user/userSlice';
import Toast from 'react-native-toast-message';
import {
    CheckCircle,
    AlertCircle,
    Clock,
    X,
    Award,
    TrendingUp,
    Users,
    HeadphonesIcon,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BecomeInstructorScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const {
        instructorApplication,
        isApplicationLoading,
        isLoading,
        isSuccess,
        isError,
        message,
    } = useSelector((state) => state.user);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        bio: '',
        experience: '',
        sampleVideoUrl: '',
        intendedTopics: '',
    });

    // Fetch application status on mount
    useEffect(() => {
        dispatch(getInstructorApplication());
    }, [dispatch]);

    // Handle success/error messages
    useEffect(() => {
        if (isSuccess && message) {
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: message,
            });
            setIsModalOpen(false);
            dispatch(getInstructorApplication()); // Refresh status
            dispatch(reset());
        }

        if (isError && message) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: message,
            });
            dispatch(reset());
        }
    }, [isSuccess, isError, message, dispatch]);

    // Pre-fill form if rejected
    useEffect(() => {
        if (instructorApplication?.status === 'rejected') {
            setFormData({
                bio: instructorApplication.bio || '',
                experience: instructorApplication.experience || '',
                sampleVideoUrl: instructorApplication.sampleVideoUrl || '',
                intendedTopics: instructorApplication.intendedTopics
                    ? instructorApplication.intendedTopics.join(', ')
                    : '',
            });
        }
    }, [instructorApplication]);

    const handleInputChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = () => {
        if (!formData.bio || !formData.experience) {
            Alert.alert('Error', 'Please fill in Bio and Experience fields');
            return;
        }

        dispatch(applyToBecomeInstructor(formData));
    };

    // Render action section based on status
    const renderActionSection = () => {
        if (isApplicationLoading) {
            return (
                <View className="py-4">
                    <ActivityIndicator size="large" color="#e11d48" />
                </View>
            );
        }

        // Case 1: Pending
        if (instructorApplication?.status === 'pending') {
            return (
                <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mx-4">
                    <View className="flex-row items-center">
                        <Clock size={24} color="#ca8a04" />
                        <View className="ml-3 flex-1">
                            <Text className="font-bold text-yellow-800 text-lg">
                                Application Pending
                            </Text>
                            <Text className="text-yellow-700 text-sm mt-1">
                                Your application is under review. This usually takes 24-48 hours.
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        // Case 2: Approved (Instructor)
        if (
            user?.role === 'instructor' ||
            instructorApplication?.status === 'approved'
        ) {
            return (
                <View className="bg-green-50 border border-green-200 rounded-2xl p-5 mx-4">
                    <View className="flex-row items-center">
                        <CheckCircle size={24} color="#16a34a" />
                        <View className="ml-3 flex-1">
                            <Text className="font-bold text-green-800 text-lg">
                                Xin chúc mừng!
                            </Text>
                            <Text className="text-green-700 text-sm mt-1">
                                Bạn đã trở thành Instructor. Đi đến bảng điều khiển của bạn để tạo khóa học.
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        className="mt-4 bg-green-600 py-3 rounded-full"
                        onPress={() =>
                            Alert.alert(
                                'Coming Soon',
                                'Instructor Dashboard is coming soon!'
                            )
                        }
                    >
                        <Text className="text-white text-center font-bold">
                            Go to Dashboard
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Case 3: Rejected
        if (instructorApplication?.status === 'rejected') {
            return (
                <View className="mx-4">
                    <View className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
                        <View className="flex-row items-start">
                            <AlertCircle size={24} color="#dc2626" />
                            <View className="ml-3 flex-1">
                                <Text className="font-bold text-red-800 text-lg">
                                    Application Rejected
                                </Text>
                                <Text className="text-red-700 text-sm mt-1">
                                    Reason: {instructorApplication.rejectionReason || 'Not specified'}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity
                        className="bg-rose-600 py-4 rounded-full"
                        onPress={() => setIsModalOpen(true)}
                    >
                        <Text className="text-white text-center font-bold text-base">
                            Update & Re-Apply
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Case 4: No application yet
        return (
            <View className="mx-4">
                <TouchableOpacity
                    className="bg-rose-600 py-4 rounded-full shadow-lg"
                    onPress={() => setIsModalOpen(true)}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        Register Now
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const benefits = [
        {
            title: 'Flexible Work',
            desc: 'Teach at your own pace.',
            icon: '⏰',
            color: '#3b82f6',
        },
        {
            title: 'Earning Potential',
            desc: 'Monetize your expertise.',
            icon: '💰',
            color: '#10b981',
        },
        {
            title: 'Impact',
            desc: 'Reach and educate learners.',
            icon: '🌍',
            color: '#f59e0b',
        },
        {
            title: 'Support',
            desc: 'Access to dedicated support.',
            icon: '🎧',
            color: '#8b5cf6',
        },
    ];

    const steps = [
        {
            title: 'Apply & Get Approved',
            desc: 'Submit your application and get approved to access the platform.',
            icon: '✅',
        },
        {
            title: 'Create & Upload Content',
            desc: 'Develop and upload your courses, including videos.',
            icon: '📹',
        },
        {
            title: 'Teach & Earn',
            desc: 'Reach learners worldwide and start earning.',
            icon: '💸',
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={['#f43f5e', '#9f1239']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-6 pt-6 pb-8"
                >
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mb-4"
                    >
                        <Text className="text-white text-base">← Back</Text>
                    </TouchableOpacity>
                    <Text className="text-white text-3xl font-bold">
                        Become an Instructor
                    </Text>
                    <Text className="text-white/90 text-base mt-2">
                        Share your knowledge and inspire the future
                    </Text>
                </LinearGradient>

                {/* Share Knowledge Section */}
                <View className="px-6 py-8">
                    <View className="mb-6">
                        <Text className="text-rose-600 font-semibold mb-2">
                            SHARE KNOWLEDGE
                        </Text>
                        <Text className="text-gray-900 text-2xl font-bold mb-3">
                            Share Your Knowledge. Inspire the Future.
                        </Text>
                        <Text className="text-gray-600 text-base leading-6">
                            Share your knowledge, inspire learners worldwide, and earn while
                            doing what you love. Join a community of experts transforming
                            education through engaging and accessible content.
                        </Text>
                    </View>

                    {/* Benefits Grid */}
                    <View className="mb-6">
                        {benefits.map((item, idx) => (
                            <View
                                key={idx}
                                className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center"
                            >
                                <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mr-3">
                                    <Text className="text-2xl">{item.icon}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-800 text-base">
                                        {item.title}
                                    </Text>
                                    <Text className="text-gray-500 text-sm">{item.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Action Section */}
                    {renderActionSection()}
                </View>

                {/* How It Works Section */}
                <View className="bg-gray-50 px-6 py-8">
                    <Text className="text-rose-600 font-semibold text-center mb-2">
                        OUR WORKFLOW
                    </Text>
                    <Text className="text-gray-900 text-2xl font-bold text-center mb-2">
                        How It Works
                    </Text>
                    <Text className="text-gray-500 text-center mb-8">
                        Turn Your Expertise into Impact in Just 3 Simple Steps!
                    </Text>

                    {steps.map((step, idx) => (
                        <View
                            key={idx}
                            className="bg-white rounded-2xl p-6 mb-4 items-center"
                        >
                            <Text className="text-4xl mb-3">{step.icon}</Text>
                            <Text className="font-bold text-xl text-gray-900 mb-2 text-center">
                                {step.title}
                            </Text>
                            <Text className="text-gray-500 text-center">{step.desc}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Application Modal */}
            <Modal
                visible={isModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalOpen(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[90%]">
                        {/* Modal Header */}
                        <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
                            <Text className="text-xl font-bold text-gray-900">
                                Instructor Application
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Form */}
                        <ScrollView className="px-6 py-4">
                            {/* Bio */}
                            <View className="mb-4">
                                <Text className="text-sm font-bold text-gray-700 mb-2">
                                    Professional Bio <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    multiline
                                    numberOfLines={4}
                                    value={formData.bio}
                                    onChangeText={(value) => handleInputChange('bio', value)}
                                    placeholder="Tell us about yourself, your expertise, and why you want to teach..."
                                    className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Experience */}
                            <View className="mb-4">
                                <Text className="text-sm font-bold text-gray-700 mb-2">
                                    Experience & Qualifications{' '}
                                    <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    multiline
                                    numberOfLines={3}
                                    value={formData.experience}
                                    onChangeText={(value) =>
                                        handleInputChange('experience', value)
                                    }
                                    placeholder="List your relevant work experience, certifications, or degrees..."
                                    className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Intended Topics */}
                            <View className="mb-4">
                                <Text className="text-sm font-bold text-gray-700 mb-2">
                                    Intended Topics
                                </Text>
                                <TextInput
                                    value={formData.intendedTopics}
                                    onChangeText={(value) =>
                                        handleInputChange('intendedTopics', value)
                                    }
                                    placeholder="e.g. Web Development, Digital Marketing (comma separated)"
                                    className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                                />
                            </View>

                            {/* Sample Video URL */}
                            <View className="mb-4">
                                <Text className="text-sm font-bold text-gray-700 mb-2">
                                    Sample Video URL (Optional)
                                </Text>
                                <TextInput
                                    value={formData.sampleVideoUrl}
                                    onChangeText={(value) =>
                                        handleInputChange('sampleVideoUrl', value)
                                    }
                                    placeholder="Link to a YouTube video demonstrating your teaching style"
                                    className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                                    keyboardType="url"
                                />
                                <Text className="text-xs text-gray-500 mt-1">
                                    Providing a sample video increases your chances of approval.
                                </Text>
                            </View>

                            {/* Buttons */}
                            <View className="flex-row gap-3 mt-4 mb-6">
                                <TouchableOpacity
                                    className="flex-1 bg-gray-100 py-3 rounded-xl"
                                    onPress={() => setIsModalOpen(false)}
                                >
                                    <Text className="text-gray-600 text-center font-semibold">
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 bg-rose-600 py-3 rounded-xl"
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white text-center font-bold">
                                            Submit Application
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default BecomeInstructorScreen;
