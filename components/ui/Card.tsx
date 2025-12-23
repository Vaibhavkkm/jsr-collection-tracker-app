/**
 * Premium Card Component
 * Soft shadows, rounded corners, subtle gradients
 */

import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, useColorScheme } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/Colors';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'success' | 'warning' | 'muted';
    onPress?: () => void;
    pressable?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
    children,
    style,
    variant = 'default',
    onPress,
    pressable = false
}: CardProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const getBackgroundColor = () => {
        switch (variant) {
            case 'success':
                return colorScheme === 'dark' ? '#1a3a2a' : '#e8f5e9';
            case 'warning':
                return colorScheme === 'dark' ? '#3a3a1a' : '#fff8e1';
            case 'muted':
                return colorScheme === 'dark' ? '#2a2a3e' : '#f5f5f5';
            default:
                return colors.card;
        }
    };

    const cardStyle = [
        styles.card,
        {
            backgroundColor: getBackgroundColor(),
            borderColor: colors.cardBorder,
        },
        Shadows.medium,
        style,
    ];

    if (pressable || onPress) {
        return (
            <AnimatedPressable
                onPress={onPress}
                onPressIn={() => {
                    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
                }}
                onPressOut={() => {
                    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
                }}
                style={[animatedStyle, cardStyle]}
            >
                {children}
            </AnimatedPressable>
        );
    }

    return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderWidth: 1,
    },
});

export default Card;
