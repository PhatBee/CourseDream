import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
// Giả sử bạn có action logout trong authSlice (nhớ kiểm tra lại đường dẫn import)
// import { logout } from '../../features/auth/authSlice'; 

const ProfileScreen = () => {
  const dispatch = useDispatch();
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Text className="text-xl font-bold text-gray-800 mb-5">User Profile</Text>
      <TouchableOpacity 
        className="bg-rose-500 px-5 py-2 rounded-lg"
        // onPress={() => dispatch(logout())}
      >
        <Text className="text-white font-bold">Logout (Demo)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};
export default ProfileScreen;