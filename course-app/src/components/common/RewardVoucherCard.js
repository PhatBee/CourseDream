import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Gift } from 'lucide-react-native';

const RewardVoucherCard = ({ voucher }) => {
  // Tính số ngày còn lại
  const getDaysLeft = (endDate) => {
    const diffTime = new Date(endDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysLeft = getDaysLeft(voucher.endDate);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.tag}>
          <Gift size={12} color="#b45309" />
          <Text style={styles.tagText}>Quà hoàn thành khóa</Text>
        </View>
        <Text style={styles.expiry}>
          Còn {daysLeft} ngày
        </Text>
      </View>

      <Text style={styles.title}>Ưu đãi độc quyền giảm {voucher.discountValue}%</Text>
      <Text style={styles.subtitle}>Áp dụng cho mọi khóa học tiếp theo trên hệ thống</Text>

      <View style={styles.codeContainer}>
        <Text style={styles.codeText}>{voucher.code}</Text>
      </View>

      <View style={styles.infoWrapper}>
        <Text style={styles.infoText}>
          Mã giảm giá này đã được liên kết trực tiếp với tài khoản của bạn. Bạn không cần phải sao chép hay nhập thủ công, hệ thống sẽ tự động hiển thị để chọn áp dụng tại trang thanh toán.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffdf5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginVertical: 8,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tagText: {
    color: '#b45309',
    fontSize: 10,
    fontWeight: '700',
  },
  expiry: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 16,
  },
  codeContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#b45309',
    fontSize: 14,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  infoWrapper: {
    paddingHorizontal: 2,
  },
  infoText: {
    color: '#6b7280',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'justify',
  },
});

export default RewardVoucherCard;
