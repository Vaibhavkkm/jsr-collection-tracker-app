/**
 * Person Collection Card Component
 * Shows person info with quick collection actions
 * States: Pending, Collected, Skipped
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence,
    FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight, Shadows, TouchTargets } from '@/constants/Colors';
import { CollectionStatus } from '@/types';
import Button from '@/components/ui/Button';

interface PersonCardProps {
    id: number;
    name: string;
    defaultAmount: number;
    cycleTotal: number;
    status: CollectionStatus;
    todayAmount?: number;
    onCollect: (amount: number) => void;
    onCustom: () => void;
    onSkip: () => void;
    onUndo: () => void;
    onPress: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function PersonCard({
    name,
    defaultAmount,
    cycleTotal,
    status,
    todayAmount,
    onCollect,
    onCustom,
    onSkip,
    onUndo,
    onPress,
}: PersonCardProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const checkScale = useSharedValue(1);

    const getCardBackground = () => {
        switch (status) {
            case 'collected':
                return colorScheme === 'dark' ? '#1a3a2a' : '#e8f5e9';
            case 'skipped':
                return colorScheme === 'dark' ? '#2a2a3e' : '#f5f5f5';
            default:
                return colors.card;
        }
    };

    const handleQuickCollect = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        checkScale.value = withSequence(
            withSpring(1.2, { damping: 10, stiffness: 400 }),
            withSpring(1, { damping: 10, stiffness: 400 })
        );
        onCollect(defaultAmount);
    };

    const checkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
    }));

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <AnimatedView
            entering={FadeIn.duration(300)}
            style={[
                styles.container,
                {
                    backgroundColor: getCardBackground(),
                    borderColor: colors.cardBorder,
                },
                Shadows.medium,
            ]}
        >
            {/* Header Row - Name and Status */}
            <Pressable onPress={onPress} style={styles.header}>
                <View style={styles.nameRow}>
                    <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
                        <Text style={[styles.avatarText, { color: colors.accent }]}>
                            {name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
                        <Text style={[styles.cycleTotal, { color: colors.textSecondary }]}>
                            Cycle Total: {formatCurrency(cycleTotal)}
                        </Text>
                    </View>
                </View>

                {/* Status Icon */}
                <Animated.View style={checkAnimatedStyle}>
                    {status === 'collected' && (
                        <MaterialCommunityIcons name="check-circle" size={28} color={colors.success} />
                    )}
                    {status === 'skipped' && (
                        <MaterialCommunityIcons name="skip-next-circle" size={28} color={colors.textMuted} />
                    )}
                    {status === 'pending' && (
                        <MaterialCommunityIcons name="clock-outline" size={28} color={colors.accent} />
                    )}
                </Animated.View>
            </Pressable>

            {/* Collection Info / Actions */}
            {status === 'collected' && (
                <View style={styles.collectedRow}>
                    <Text style={[styles.collectedAmount, { color: colors.success }]}>
                        Collected: {formatCurrency(todayAmount || 0)}
                    </Text>
                    <Pressable onPress={onUndo}>
                        <Text style={[styles.undoText, { color: colors.textMuted }]}>Undo</Text>
                    </Pressable>
                </View>
            )}

            {status === 'skipped' && (
                <View style={styles.collectedRow}>
                    <Text style={[styles.skippedText, { color: colors.textMuted }]}>
                        Skipped for today
                    </Text>
                    <Pressable onPress={onUndo}>
                        <Text style={[styles.undoText, { color: colors.textMuted }]}>Undo</Text>
                    </Pressable>
                </View>
            )}

            {status === 'pending' && (
                <View style={styles.actionsRow}>
                    <Text style={[styles.defaultText, { color: colors.textSecondary }]}>
                        Default: {formatCurrency(defaultAmount)}
                    </Text>
                    <View style={styles.buttons}>
                        <Button
                            title={`${formatCurrency(defaultAmount)} ✓`}
                            onPress={handleQuickCollect}
                            variant="success"
                            size="small"
                            style={styles.collectButton}
                        />
                        <Button
                            title="Custom"
                            onPress={onCustom}
                            variant="secondary"
                            size="small"
                        />
                        <Button
                            title="Skip"
                            onPress={onSkip}
                            variant="skip"
                            size="small"
                        />
                    </View>
                </View>
            )}
        </AnimatedView>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    nameContainer: {
        flex: 1,
    },
    name: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    cycleTotal: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    collectedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    collectedAmount: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    skippedText: {
        fontSize: FontSize.md,
    },
    undoText: {
        fontSize: FontSize.sm,
        textDecorationLine: 'underline',
    },
    actionsRow: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    defaultText: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
    },
    buttons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    collectButton: {
        flex: 1,
    },
});

export default PersonCard;
