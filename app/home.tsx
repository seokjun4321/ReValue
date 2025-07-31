import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import "./global.css";

export default function home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>You have now entered the home</Text>
      <Text style={styles.subText}>Welcome to the Home!</Text>
      <TouchableOpacity
        className="bg-yellow-300 py-3 px-10 rounded-full shadow-lg mb-4" // 마진 추가
            onPress={() => router.push('/mapscreen')}>
        <Text> MAP </Text>
      </TouchableOpacity>

      {/*<Button title="장바구니로 이동" onPress={() => router.push('/cart')} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subText: {
    fontSize: 20,
    color: '#333',
  },
});
