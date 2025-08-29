import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { LevelSystem } from '../../lib/gamification';

interface LevelProgressProps {
  levelSystem: LevelSystem;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function LevelProgress({ levelSystem }: LevelProgressProps) {
  const progressWidth = (levelSystem.currentExp / levelSystem.expToNextLevel) * 100;
  const benefits = levelSystem.benefits.find(b => b.level === levelSystem.currentLevel);

  const progressStyle = useAnimatedStyle(() => ({
    width: withSequence(
      withDelay(
        300,
        withSpring(`${progressWidth}%`, {
          damping: 15,
          stiffness: 100,
        })
      )
    ),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.levelTitle}>Level {levelSystem.currentLevel}</Text>
          <Text style={styles.expText}>
            {levelSystem.currentExp} / {levelSystem.expToNextLevel} EXP
          </Text>
        </View>
        
        <View style={styles.nextLevel}>
          <Text style={styles.nextLevelText}>
            다음 레벨까지 {levelSystem.expToNextLevel - levelSystem.currentExp} EXP
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground} />
        <AnimatedLinearGradient
          colors={['#ff6b6b', '#ff8787']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, progressStyle]}
        />
      </View>

      {benefits && (
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>현재 레벨 혜택</Text>
          <View style={styles.benefitsList}>
            {benefits.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitText}>• {benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.unlockedFeatures}>
        <Text style={styles.unlockedTitle}>잠금 해제된 기능</Text>
        <View style={styles.featuresList}>
          {benefits?.unlockedFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 4,
  },
  expText: {
    fontSize: 14,
    color: '#868e96',
  },
  nextLevel: {
    backgroundColor: '#fff5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  nextLevelText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  progressContainer: {
    height: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f1f3f5',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  benefitsContainer: {
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#495057',
  },
  unlockedFeatures: {
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
    paddingTop: 16,
  },
  unlockedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191f28',
    marginBottom: 12,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#495057',
  },
});
