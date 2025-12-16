// src/configs/toastConfig.js
import React from 'react';
import { View, Text } from 'react-native';
import { BaseToast, ErrorToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#e11d48',
        borderLeftWidth: 5,
        backgroundColor: 'white',
        height: 70,
        width: '90%',
        borderRadius: 15,
        shadowColor: '#e11d48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937'
      }}
      text2Style={{
        fontSize: 13,
        color: '#6b7280'
      }}
    />
  ),

  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        height: 70,
        width: '90%',
        borderRadius: 15,
        elevation: 5,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ef4444'
      }}
      text2Style={{
        fontSize: 13,
        color: '#6b7280'
      }}
    />
  ),

  rose_info: ({ text1, text2 }) => (
    <View style={{ 
      height: 60, 
      width: '90%', 
      backgroundColor: '#fff1f2',
      borderRadius: 15,
      borderWidth: 1,
      borderColor: '#fda4af',
      justifyContent: 'center',
      paddingHorizontal: 20,
      elevation: 3
    }}>
      <Text style={{ color: '#be123c', fontWeight: 'bold' }}>{text1}</Text>
      <Text style={{ color: '#be123c', fontSize: 12 }}>{text2}</Text>
    </View>
  )
};