import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserTier, EcoSaverTier } from '../../lib/gamification';

interface TierBadgeProps {
  type: 'user' | 'eco';
  tier: UserTier | EcoSaverTier;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const USER_TIER_COLORS: Record<UserTier, { start: string; end: string; icon: string }> = {
  bronze: {
    start: '#e8590c',
    end: '#d9480f',
    icon: 'medal',
  },
  silver: {
    start: '#adb5bd',
    end: '#868e96',
    icon: 'medal',
  },
  gold: {
    start: '#ffd43b',
    end: '#fab005',
    icon: 'medal',
  },
  platinum: {
    start: '#74c0fc',
    end: '#4dabf7',
    icon: 'diamond',
  },
  diamond: {
    start: '#da77f2',
    end: '#be4bdb',
    icon: 'diamond',
  },
};

const ECO_TIER_COLORS: Record<EcoSaverTier, { start: string; end: string; icon: string }> = {
  sprout: {
    start: '#8ce99a',
    end: '#69db7c',
    icon: 'leaf',
  },
  leaf: {
    start: '#69db7c',
    end: '#40c057',
    icon: 'leaf',
  },
  tree: {
    start: '#40c057',
    end: '#2f9e44',
    icon: 'leaf',
  },
  forest: {
    start: '#2f9e44',
    end: '#2b8a3e',
    icon: 'leaf',
  },
  guardian: {
    start: '#2b8a3e',
    end: '#237032',
    icon: 'shield',
  },
};

const BADGE_SIZES = {
  small: {
    container: 24,
    icon: 12,
    fontSize: 10,
  },
  medium: {
    container: 32,
    icon: 16,
    fontSize: 12,
  },
  large: {
    container: 48,
    icon: 24,
    fontSize: 14,
  },
};

export default function TierBadge({
  type,
  tier,
  size = 'medium',
  style,
}: TierBadgeProps) {
  const colors = type === 'user'
    ? USER_TIER_COLORS[tier as UserTier]
    : ECO_TIER_COLORS[tier as EcoSaverTier];
    
  const sizeConfig = BADGE_SIZES[size];

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[colors.start, colors.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: sizeConfig.container,
            height: sizeConfig.container,
            borderRadius: sizeConfig.container / 2,
          },
        ]}
      >
        <Ionicons
          name={colors.icon as any}
          size={sizeConfig.icon}
          color="#ffffff"
        />
      </LinearGradient>
      <Text
        style={[
          styles.tierText,
          { fontSize: sizeConfig.fontSize },
          type === 'eco' && styles.ecoText,
        ]}
      >
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tierText: {
    fontWeight: '600',
    color: '#191f28',
  },
  ecoText: {
    color: '#2f9e44',
  },
});
