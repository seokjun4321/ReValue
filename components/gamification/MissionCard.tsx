import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Mission, MissionType } from '../../lib/gamification';
import AnimatedButton from '../common/AnimatedButton';

interface MissionCardProps {
  mission: Mission;
  onPress?: () => void;
}

const MISSION_ICONS: Record<MissionType, string> = {
  purchase: 'cart',
  review: 'star',
  eco: 'leaf',
  visit: 'location',
  social: 'people',
  referral: 'person-add',
};

const MISSION_COLORS: Record<MissionType, { start: string; end: string }> = {
  purchase: {
    start: '#ff6b6b',
    end: '#f03e3e',
  },
  review: {
    start: '#ffd43b',
    end: '#fab005',
  },
  eco: {
    start: '#69db7c',
    end: '#40c057',
  },
  visit: {
    start: '#4dabf7',
    end: '#228be6',
  },
  social: {
    start: '#da77f2',
    end: '#be4bdb',
  },
  referral: {
    start: '#a5d8ff',
    end: '#74c0fc',
  },
};

export default function MissionCard({ mission, onPress }: MissionCardProps) {
  const colors = MISSION_COLORS[mission.type];
  const icon = MISSION_ICONS[mission.type];
  
  const formatProgress = () => {
    const progress = Math.min(mission.progress, mission.target.value);
    return `${progress}/${mission.target.value}`;
  };

  const progressPercentage = (mission.progress / mission.target.value) * 100;

  return (
    <AnimatedButton
      onPress={onPress}
      style={styles.container}
      accessibilityLabel={`${mission.title} 미션`}
      accessibilityHint={mission.description}
    >
      <LinearGradient
        colors={[colors.start + '20', colors.end + '20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.start + '30' }]}>
            <Ionicons name={icon as any} size={24} color={colors.end} />
          </View>
          
          {mission.period === 'daily' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>일일</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{mission.title}</Text>
        <Text style={styles.description}>{mission.description}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: colors.end,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{formatProgress()}</Text>
        </View>

        <View style={styles.rewards}>
          {mission.rewards.map((reward, index) => (
            <View key={index} style={styles.rewardItem}>
              <Text style={styles.rewardAmount}>+{reward.amount}</Text>
              <Text style={styles.rewardType}>{reward.description}</Text>
            </View>
          ))}
        </View>
      </View>
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff6b6b20',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191f28',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f3f5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#868e96',
    textAlign: 'right',
  },
  rewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#40c057',
    marginRight: 4,
  },
  rewardType: {
    fontSize: 14,
    color: '#495057',
  },
});
