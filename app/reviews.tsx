// app/reviews.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ReviewsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 후기</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.placeholder}>
          <Ionicons name="star-outline" size={60} color="#9ca3af" />
          <Text style={styles.placeholderText}>작성한 후기가 여기에 표시됩니다.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// 스타일은 history.tsx와 동일하게 사용합니다.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 16,
  },
  content: { flex: 1, padding: 20 },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
});