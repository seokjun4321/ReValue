import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import "../global.css";

export default function home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ReValue</Text>
        <Text style={styles.subTitle}>환영합니다!</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.welcomeSection}>
          <Ionicons name="home" size={60} color="#fbbf24" />
          <Text style={styles.welcomeText}>홈 화면에 오신 것을 환영합니다!</Text>
          <Text style={styles.subText}>ReValue 앱을 통해 다양한 기능을 이용해보세요.</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="search" size={32} color="#fbbf24" />
            <Text style={styles.actionText}>장소 검색</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart" size={32} color="#fbbf24" />
            <Text style={styles.actionText}>찜한 장소</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="location" size={32} color="#fbbf24" />
            <Text style={styles.actionText}>내 위치</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>최근 방문한 장소</Text>
          <View style={styles.recentItem}>
            <Ionicons name="location" size={24} color="#fbbf24" />
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>스타벅스 강남점</Text>
              <Text style={styles.itemSubtitle}>2일 전 방문</Text>
            </View>
          </View>
          <View style={styles.recentItem}>
            <Ionicons name="location" size={24} color="#fbbf24" />
            <View style={styles.itemText}>
              <Text style={styles.itemTitle}>올리브영 홍대점</Text>
              <Text style={styles.itemSubtitle}>5일 전 방문</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  recentSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemText: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});
