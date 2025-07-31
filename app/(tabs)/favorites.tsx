import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import "../global.css";

export default function Favorites() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>찜한 장소</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.favoritesList}>
          <TouchableOpacity style={styles.favoriteItem}>
            <View style={styles.itemContent}>
              <Ionicons name="location" size={24} color="#fbbf24" />
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>스타벅스 강남점</Text>
                <Text style={styles.itemSubtitle}>서울특별시 강남구</Text>
              </View>
              <Ionicons name="heart" size={20} color="#ef4444" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.favoriteItem}>
            <View style={styles.itemContent}>
              <Ionicons name="location" size={24} color="#fbbf24" />
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>올리브영 홍대점</Text>
                <Text style={styles.itemSubtitle}>서울특별시 마포구</Text>
              </View>
              <Ionicons name="heart" size={20} color="#ef4444" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.favoriteItem}>
            <View style={styles.itemContent}>
              <Ionicons name="location" size={24} color="#fbbf24" />
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>이마트 잠실점</Text>
                <Text style={styles.itemSubtitle}>서울특별시 송파구</Text>
              </View>
              <Ionicons name="heart" size={20} color="#ef4444" />
            </View>
          </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  favoritesList: {
    paddingTop: 20,
  },
  favoriteItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
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