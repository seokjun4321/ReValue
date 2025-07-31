import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import "../global.css";

export default function Profile() {
  const router = useRouter();

  const handleLogout = () => {
    // 로그아웃 로직
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#fbbf24" />
          </View>
          <Text style={styles.userName}>사용자님</Text>
          <Text style={styles.userEmail}>user@example.com</Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="settings" size={24} color="#fbbf24" />
              <Text style={styles.menuText}>설정</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="notifications" size={24} color="#fbbf24" />
              <Text style={styles.menuText}>알림 설정</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="help-circle" size={24} color="#fbbf24" />
              <Text style={styles.menuText}>도움말</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuContent}>
              <Ionicons name="information-circle" size={24} color="#fbbf24" />
              <Text style={styles.menuText}>앱 정보</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  menuSection: {
    marginBottom: 20,
  },
  menuItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 8,
    fontWeight: 'bold',
  },
}); 