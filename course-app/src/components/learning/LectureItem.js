import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PlayCircle, CheckCircle, Circle, Clock } from 'lucide-react-native';

const LectureItem = ({ lecture, index, isCurrent, isCompleted, onPress, onToggleComplete }) => {

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.row,
        isCurrent && styles.rowActive,
      ]}
    >
      {/* ── Index badge ── */}
      <View style={[styles.indexBadge, isCurrent && styles.indexBadgeActive]}>
        <Text style={[styles.indexText, isCurrent && styles.indexTextActive]}>
          {index + 1}
        </Text>
      </View>

      {/* ── Info ── */}
      <View style={styles.info}>
        <Text
          style={[styles.title, isCurrent && styles.titleActive]}
          numberOfLines={2}
        >
          {lecture.title}
        </Text>

        {lecture.duration > 0 && (
          <View style={styles.metaRow}>
            <Clock size={11} color={isCurrent ? '#fda4af' : '#9ca3af'} />
            <Text style={[styles.duration, isCurrent && styles.durationActive]}>
              {formatDuration(lecture.duration)}
            </Text>
          </View>
        )}
      </View>

      {/* ── Play indicator (only for current) ── */}
      {isCurrent && (
        <PlayCircle size={18} color="#e11d48" style={styles.playIcon} />
      )}

      {/* ── Checkbox ── */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation && e.stopPropagation();
          onToggleComplete();
        }}
        style={styles.checkbox}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isCompleted ? (
          <CheckCircle size={22} color="#10b981" fill="#d1fae5" />
        ) : (
          <Circle size={22} color="#d1d5db" />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
    backgroundColor: '#fff',
  },
  rowActive: {
    backgroundColor: '#fff5f7',
    borderLeftWidth: 3,
    borderLeftColor: '#e11d48',
  },

  // Index badge
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  indexBadgeActive: {
    backgroundColor: '#ffe4e6',
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
  },
  indexTextActive: {
    color: '#e11d48',
  },

  // Info
  info: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 3,
  },
  titleActive: {
    color: '#be123c',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    fontSize: 11,
    color: '#9ca3af',
  },
  durationActive: {
    color: '#fda4af',
  },

  // Play icon
  playIcon: {
    marginRight: 8,
  },

  // Checkbox
  checkbox: {
    padding: 4,
    flexShrink: 0,
  },
});

export default LectureItem;