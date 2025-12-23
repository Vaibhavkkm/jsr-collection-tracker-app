/**
 * Premium Button Component
 * Large touch targets (56dp+), spring animations, haptic feedback
 */

import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle, useColorScheme } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight, TouchTargets } from '@/constants/Colors';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'skip' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
    haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    icon,
    style,
    textStyle,
    fullWidth = false,
    haptic = true,
}: ButtonProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = async () => {
        if (disabled) return;
        if (haptic) {
            await Haptics.impactAsync(
                variant === 'success'
                    ? Haptics.ImpactFeedbackStyle.Medium
                    : Haptics.ImpactFeedbackStyle.Light
            );
        }
        onPress();
    };

    const getButtonStyles = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: BorderRadius.md,
            gap: Spacing.sm,
        };

        // Size styles
        switch (size) {
            case 'small':
                baseStyle.height = TouchTargets.minimum;
                baseStyle.paddingHorizontal = Spacing.md;
                break;
            case 'large':
                baseStyle.height = TouchTargets.large;
                baseStyle.paddingHorizontal = Spacing.xl;
                break;
            default:
                baseStyle.height = TouchTargets.preferred;
                baseStyle.paddingHorizontal = Spacing.lg;
        }

        // Variant styles
        switch (variant) {
            case 'primary':
                baseStyle.backgroundColor = colors.buttonPrimary;
                break;
            case 'secondary':
                baseStyle.backgroundColor = colors.buttonSecondary;
                break;
            case 'success':
                baseStyle.backgroundColor = colors.buttonSuccess;
                break;
            case 'skip':
                baseStyle.backgroundColor = colors.buttonSkip;
                break;
            case 'outline':
                baseStyle.backgroundColor = 'transparent';
                baseStyle.borderWidth = 2;
                baseStyle.borderColor = colors.accent;
                break;
            case 'ghost':
                baseStyle.backgroundColor = 'transparent';
                break;
        }

        if (disabled) {
            baseStyle.opacity = 0.5;
        }

        if (fullWidth) {
            baseStyle.width = '100%';
        }

        return baseStyle;
    };

    const getTextStyles = (): TextStyle => {
        const baseTextStyle: TextStyle = {
            fontWeight: FontWeight.semibold,
        };

        // Size styles
        switch (size) {
            case 'small':
                baseTextStyle.fontSize = FontSize.sm;
                break;
            case 'large':
                baseTextStyle.fontSize = FontSize.lg;
                break;
            default:
                baseTextStyle.fontSize = FontSize.md;
        }

        // Variant text colors
        switch (variant) {
            case 'primary':
                baseTextStyle.color = colors.buttonPrimaryText;
                break;
            case 'secondary':
                baseTextStyle.color = colors.buttonSecondaryText;
                break;
            case 'success':
                baseTextStyle.color = colors.buttonSuccessText;
                break;
            case 'skip':
                baseTextStyle.color = colors.buttonSkipText;
                break;
            case 'outline':
            case 'ghost':
                baseTextStyle.color = colors.accent;
                break;
        }

        return baseTextStyle;
    };

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={() => {
                if (!disabled) {
                    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
                }
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            disabled={disabled}
            style={[animatedStyle, getButtonStyles(), style]}
        >
            {icon}
            <Text style={[getTextStyles(), textStyle]}>{title}</Text>
        </AnimatedPressable>
    );
}

export default Button;
