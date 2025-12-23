/**
 * Summary Card Component
 * For dashboard statistics (Today's collection, Pending, Month total)
 */

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight, Shadows } from '@/constants/Colors';

interface SummaryCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

export function SummaryCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
}: SummaryCardProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const getTrendColor = () => {
        switch (trend) {
            case 'up':
                return colors.success;
            case 'down':
                return colors.error;
            default:
                return colors.textSecondary;
        }
    };

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return '↑';
            case 'down':
                return '↓';
            default:
                return '';
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                },
                Shadows.small,
            ]}
        >
            <View style={styles.header}>
                {icon && <View style={styles.icon}>{icon}</View>}
                <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
            </View>

            <Text style={[styles.value, { color: colors.text }]}>{value}</Text>

            {(subtitle || trendValue) && (
                <View style={styles.footer}>
                    {subtitle && (
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                            {subtitle}
                        </Text>
                    )}
                    {trendValue && trend && (
                        <Text style={[styles.trend, { color: getTrendColor() }]}>
                            {getTrendIcon()}{trendValue}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 140,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    icon: {
        marginRight: Spacing.xs,
    },
    title: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        marginVertical: Spacing.xs,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    subtitle: {
        fontSize: FontSize.xs,
    },
    trend: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
});

export default SummaryCard;
