/**
 * Custom Number Pad Component
 * For entering custom collection amounts
 * Large touch targets, haptic feedback
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight, TouchTargets } from '@/constants/Colors';
import Button from './Button';

interface NumberPadProps {
    value: string;
    onValueChange: (value: string) => void;
    onConfirm: () => void;
    onCancel?: () => void;
    personName?: string;
    maxAmount?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NumberKey({
    label,
    onPress,
    wide = false
}: {
    label: string;
    onPress: () => void;
    wide?: boolean;
}) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={() => {
                scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { damping: 15, stiffness: 400 });
            }}
            style={[
                animatedStyle,
                styles.key,
                wide && styles.wideKey,
                { backgroundColor: colors.surfaceElevated },
            ]}
        >
            <Text style={[styles.keyText, { color: colors.text }]}>{label}</Text>
        </AnimatedPressable>
    );
}

export function NumberPad({
    value,
    onValueChange,
    onConfirm,
    onCancel,
    personName,
    maxAmount = 99999999, // Up to ₹9,99,99,999 (nearly 10 crore)
}: NumberPadProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const handleKeyPress = (key: string) => {
        if (key === '⌫') {
            onValueChange(value.slice(0, -1));
        } else if (key === '00') {
            if (value.length > 0 && parseInt(value + '00') <= maxAmount) {
                onValueChange(value + '00');
            }
        } else {
            if (parseInt(value + key) <= maxAmount) {
                onValueChange(value + key);
            }
        }
    };

    const numericValue = parseInt(value) || 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {personName && (
                <Text style={[styles.title, { color: colors.textSecondary }]}>
                    Enter Amount for {personName}
                </Text>
            )}

            {/* Amount Display */}
            <View style={[styles.display, { borderColor: colors.cardBorder }]}>
                <Text style={[styles.currency, { color: colors.accent }]}>₹</Text>
                <Text style={[styles.amount, { color: colors.text }]}>
                    {numericValue > 0 ? numericValue.toLocaleString('en-IN') : '0'}
                </Text>
            </View>

            {/* Number Pad Grid */}
            <View style={styles.grid}>
                <View style={styles.row}>
                    <NumberKey label="1" onPress={() => handleKeyPress('1')} />
                    <NumberKey label="2" onPress={() => handleKeyPress('2')} />
                    <NumberKey label="3" onPress={() => handleKeyPress('3')} />
                </View>
                <View style={styles.row}>
                    <NumberKey label="4" onPress={() => handleKeyPress('4')} />
                    <NumberKey label="5" onPress={() => handleKeyPress('5')} />
                    <NumberKey label="6" onPress={() => handleKeyPress('6')} />
                </View>
                <View style={styles.row}>
                    <NumberKey label="7" onPress={() => handleKeyPress('7')} />
                    <NumberKey label="8" onPress={() => handleKeyPress('8')} />
                    <NumberKey label="9" onPress={() => handleKeyPress('9')} />
                </View>
                <View style={styles.row}>
                    <NumberKey label="⌫" onPress={() => handleKeyPress('⌫')} />
                    <NumberKey label="0" onPress={() => handleKeyPress('0')} />
                    <NumberKey label="00" onPress={() => handleKeyPress('00')} />
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                {onCancel && (
                    <Button
                        title="Cancel"
                        onPress={onCancel}
                        variant="ghost"
                        size="large"
                        style={{ flex: 1 }}
                    />
                )}
                <Button
                    title={`✓ Confirm ₹${numericValue.toLocaleString('en-IN')}`}
                    onPress={onConfirm}
                    variant="success"
                    size="large"
                    disabled={numericValue === 0}
                    style={{ flex: 2 }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
    },
    title: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    display: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
    },
    currency: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.semibold,
        marginRight: Spacing.xs,
    },
    amount: {
        fontSize: FontSize.display,
        fontWeight: FontWeight.bold,
    },
    grid: {
        gap: Spacing.sm,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.sm,
        justifyContent: 'center',
    },
    key: {
        width: 80,
        height: TouchTargets.large,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    wideKey: {
        width: 120,
    },
    keyText: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.semibold,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
});

export default NumberPad;
