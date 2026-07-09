import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

const CourseOverviewMobile = ({ course }) => {
  const { description = '', learnOutcomes = [], requirements = [] } = course;

  return (
    //   // Điều chỉnh văn bản theo text-justtify

    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
      {/* Block: What you'll learn */}
      {learnOutcomes.length > 0 && (
        <View style={{ backgroundColor: '#f0f6ff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#2563eb' }}>🎯 Bạn sẽ học được gì</Text>
          {learnOutcomes.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <CheckCircle2 size={18} color="#22c55e" style={{ marginRight: 8 }} />
              <Text style={{ color: '#222', fontSize: 15, textAlign: 'justify' }}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Block: Requirements */}
      {requirements.length > 0 && (
        <View style={{ backgroundColor: '#fff7e6', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#d97706' }}>📋 Yêu cầu khóa học</Text>
          {requirements.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: '#d97706', fontWeight: 'bold', marginRight: 8 }}>•</Text>
              <Text style={{ color: '#222', fontSize: 15, textAlign: 'justify' }}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Block: Description */}
      {description && (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#0ea5e9' }}>📝 Mô tả khóa học</Text>
          <Text style={{ color: '#444', fontSize: 15, lineHeight: 22, textAlign: 'justify', }}>{description}</Text>
        </View>
      )}
    </View>
  );
};

export default CourseOverviewMobile;