import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchInstructorProfile,
    updateInstructorData,
    resetInstructorState,
} from '../../features/instructor/instructorSlice';
import {
    ArrowLeft,
    Globe,
    Facebook,
    Youtube,
    Linkedin,
    CreditCard,
} from 'lucide-react-native';

const InstructorProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { instructorProfile, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.instructor
    );

    const [formData, setFormData] = useState({
        headline: '',
        experience: '',
        education: '',
        specialties: '',
    });

    const [socials, setSocials] = useState({
        website: '',
        facebook: '',
        youtube: '',
        linkedin: '',
    });

    const [payout, setPayout] = useState({
        bankName: '',
        bankAccount: '',
        paypalEmail: '',
    });

    // Fetch profile on mount
    useEffect(() => {
        dispatch(fetchInstructorProfile());
    }, [dispatch]);

    // Fill form when profile loads
    useEffect(() => {
        if (instructorProfile) {
            setFormData({
                headline: instructorProfile.headline || '',
                experience: instructorProfile.experience || '',
                education: instructorProfile.education || '',
                specialties: instructorProfile.specialties
                    ? instructorProfile.specialties.join(', ')
                    : '',
            });
            setSocials({
                website: instructorProfile.socialLinks?.website || '',
                facebook: instructorProfile.socialLinks?.facebook || '',
                youtube: instructorProfile.socialLinks?.youtube || '',
                linkedin: instructorProfile.socialLinks?.linkedin || '',
            });
            setPayout({
                bankName: instructorProfile.payout?.bankName || '',
                bankAccount: instructorProfile.payout?.bankAccount || '',
                paypalEmail: instructorProfile.payout?.paypalEmail || '',
            });
        }
    }, [instructorProfile]);

    // Handle success/error
    useEffect(() => {
        if (isError && message) {
            Alert.alert('Error', message);
            dispatch(resetInstructorState());
        }
        if (isSuccess && message) {
            Alert.alert('Success', message, [
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(resetInstructorState());
                        navigation.goBack();
                    },
                },
            ]);
        }
    }, [isError, isSuccess, message, dispatch, navigation]);

    const handleSubmit = () => {
        const submitData = {
            ...formData,
            specialties: formData.specialties
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            socialLinks: socials,
            payout: payout,
        };
        dispatch(updateInstructorData(submitData));
    };

    if (isLoading && !instructorProfile) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#f43f5e" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* Header */}
                <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-xl font-bold">Instructor Profile</Text>
                        <Text className="text-sm text-gray-500">Manage your profile</Text>
                    </View>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-6 py-6 space-y-8">
                        {/* Professional Info Section */}
                        <View>
                            <Text className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                Professional Information
                            </Text>

                            {/* Headline */}
                            <View className="mb-4">
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Headline
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="e.g. Senior Software Engineer"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.headline}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, headline: text })
                                    }
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Specialties */}
                            <View className="mb-4">
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Specialties
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="e.g. React, Node.js, Python (comma separated)"
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.specialties}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, specialties: text })
                                    }
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Experience */}
                            <View className="mb-4">
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Experience
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Describe your work experience..."
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.experience}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, experience: text })
                                    }
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Education */}
                            <View className="mb-4">
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Education
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Degrees, Certifications..."
                                    placeholderTextColor="#9CA3AF"
                                    value={formData.education}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, education: text })
                                    }
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* Social Links Section */}
                        <View>
                            <Text className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                Social Profiles
                            </Text>

                            {/* Website */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <Globe size={16} color="#6b7280" />
                                    <Text className="ml-2 text-[15px] font-semibold text-gray-700">
                                        Website
                                    </Text>
                                </View>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="https://yourwebsite.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={socials.website}
                                    onChangeText={(text) =>
                                        setSocials({ ...socials, website: text })
                                    }
                                    editable={!isLoading}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Facebook */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <Facebook size={16} color="#6b7280" />
                                    <Text className="ml-2 text-[15px] font-semibold text-gray-700">
                                        Facebook
                                    </Text>
                                </View>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Facebook username"
                                    placeholderTextColor="#9CA3AF"
                                    value={socials.facebook}
                                    onChangeText={(text) =>
                                        setSocials({ ...socials, facebook: text })
                                    }
                                    editable={!isLoading}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* YouTube */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <Youtube size={16} color="#6b7280" />
                                    <Text className="ml-2 text-[15px] font-semibold text-gray-700">
                                        YouTube
                                    </Text>
                                </View>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="YouTube channel"
                                    placeholderTextColor="#9CA3AF"
                                    value={socials.youtube}
                                    onChangeText={(text) =>
                                        setSocials({ ...socials, youtube: text })
                                    }
                                    editable={!isLoading}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* LinkedIn */}
                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <Linkedin size={16} color="#6b7280" />
                                    <Text className="ml-2 text-[15px] font-semibold text-gray-700">
                                        LinkedIn
                                    </Text>
                                </View>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="LinkedIn profile"
                                    placeholderTextColor="#9CA3AF"
                                    value={socials.linkedin}
                                    onChangeText={(text) =>
                                        setSocials({ ...socials, linkedin: text })
                                    }
                                    editable={!isLoading}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Payout Section */}
                        <View>
                            <View className="flex-row items-center mb-4 pb-2 border-b border-gray-100">
                                <CreditCard size={20} color="#1f2937" />
                                <Text className="ml-2 text-lg font-bold text-gray-800">
                                    Payout Details
                                </Text>
                            </View>

                            {/* Bank Name */}
                            <View className="mb-4">
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Bank Name
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Enter bank name"
                                    placeholderTextColor="#9CA3AF"
                                    value={payout.bankName}
                                    onChangeText={(text) =>
                                        setPayout({ ...payout, bankName: text })
                                    }
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Account Number */}
                            <View className="mb-4">
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    Account Number
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="Enter account number"
                                    placeholderTextColor="#9CA3AF"
                                    value={payout.bankAccount}
                                    onChangeText={(text) =>
                                        setPayout({ ...payout, bankAccount: text })
                                    }
                                    editable={!isLoading}
                                    keyboardType="number-pad"
                                />
                            </View>

                            {/* PayPal Email */}
                            <View className="mb-4">
                                <Text className="mb-2 text-[15px] font-semibold text-gray-700">
                                    PayPal Email (Optional)
                                </Text>
                                <TextInput
                                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
                                    placeholder="paypal@example.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={payout.paypalEmail}
                                    onChangeText={(text) =>
                                        setPayout({ ...payout, paypalEmail: text })
                                    }
                                    editable={!isLoading}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            className={`w-full rounded-full py-5 flex-row items-center justify-center ${isLoading ? 'bg-rose-400' : 'bg-rose-500'
                                }`}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white text-lg font-semibold">
                                    Save Changes
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default InstructorProfileScreen;
