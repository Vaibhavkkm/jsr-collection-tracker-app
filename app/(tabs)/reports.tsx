/**
 * Reports & Analytics Screen
 * Monthly overview and person breakdown with real data
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    useColorScheme,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '@/constants/Colors';
import { getDatabase, getDashboardSummary, getAllPeople, getActiveCycle } from '@/services/database';
import { exportAndShareMonthlyReport, exportAndShareStatusReport } from '@/services/export';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface PersonWithCycle {
    id: number;
    name: string;
    defaultAmount: number;
    cycleTotal: number;
    cycleStartDate: string | null;
}

export default function ReportsScreen() {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState({
        todayCollected: 0,
        todayCount: 0,
        pendingCount: 0,
        pendingEstimate: 0,
        monthTotal: 0,
    });
    const [peopleWithCycles, setPeopleWithCycles] = useState<PersonWithCycle[]>([]);
    const [totalCycleAmount, setTotalCycleAmount] = useState(0);

    const loadData = useCallback(async () => {
        try {
            await getDatabase();
            const [summaryData, peopleData] = await Promise.all([
                getDashboardSummary(),
                getAllPeople(),
            ]);
            setSummary(summaryData);

            // Get cycle data for each person
            const peopleWithCycleData: PersonWithCycle[] = [];
            let total = 0;

            for (const person of peopleData) {
                const cycle = await getActiveCycle(person.id);
                const cycleTotal = cycle?.totalAmount || 0;
                total += cycleTotal;

                peopleWithCycleData.push({
                    id: person.id,
                    name: person.name,
                    defaultAmount: person.defaultAmount,
                    cycleTotal,
                    cycleStartDate: cycle?.startDate || null,
                });
            }

            // Sort by cycle total (highest first)
            peopleWithCycleData.sort((a, b) => b.cycleTotal - a.cycleTotal);

            setPeopleWithCycles(peopleWithCycleData);
            setTotalCycleAmount(total);
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'No cycle';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        });
    };

    const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Month Header */}
            <Text style={[styles.monthTitle, { color: colors.text }]}>{currentMonth}</Text>

            {/* Overview Card */}
            <Card style={styles.overviewCard}>
                <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
                    📊 Current Status
                </Text>

                <View style={styles.statRow}>
                    <View style={styles.stat}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Cycle Totals</Text>
                        <Text style={[styles.statValue, { color: colors.accent }]}>
                            {formatCurrency(totalCycleAmount)}
                        </Text>
                        <Text style={[styles.statHint, { color: colors.textMuted }]}>
                            (pending withdrawal)
                        </Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active People</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{peopleWithCycles.length}</Text>
                    </View>
                </View>

                <View style={styles.statRow}>
                    <View style={styles.stat}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Today's Collection</Text>
                        <Text style={[styles.statValue, { color: colors.success }]}>
                            {formatCurrency(summary.todayCollected)}
                        </Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Today's Count</Text>
                        <Text style={[styles.statValue, { color: colors.text }]}>{summary.todayCount}</Text>
                    </View>
                </View>
            </Card>

            {/* Person-wise Current Cycle */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                CURRENT CYCLE BY PERSON
            </Text>

            {peopleWithCycles.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        No people added yet. Add people from the People tab.
                    </Text>
                </Card>
            ) : (
                peopleWithCycles.map((person) => (
                    <Card key={person.id} style={styles.breakdownCard}>
                        <View style={styles.breakdownHeader}>
                            <View>
                                <Text style={[styles.breakdownName, { color: colors.text }]}>{person.name}</Text>
                                <Text style={[styles.breakdownSub, { color: colors.textMuted }]}>
                                    Since {formatDate(person.cycleStartDate)} • ₹{person.defaultAmount}/day
                                </Text>
                            </View>
                            <Text style={[styles.breakdownAmount, { color: colors.success }]}>
                                {formatCurrency(person.cycleTotal)}
                            </Text>
                        </View>
                    </Card>
                ))
            )}

            {/* Export Buttons */}
            <View style={styles.exportButtons}>
                <Button
                    title="📄 Export CSV"
                    onPress={async () => {
                        try {
                            const now = new Date();
                            await exportAndShareMonthlyReport(now.getFullYear(), now.getMonth() + 1, 'csv');
                        } catch (error) {
                            console.error('Export error:', error);
                            Alert.alert('Export Failed', 'Could not generate report');
                        }
                    }}
                    variant="secondary"
                    size="medium"
                    style={{ flex: 1 }}
                />
                <Button
                    title="📑 Export PDF"
                    onPress={async () => {
                        try {
                            const now = new Date();
                            await exportAndShareMonthlyReport(now.getFullYear(), now.getMonth() + 1, 'pdf');
                        } catch (error) {
                            console.error('Export error:', error);
                            Alert.alert('Export Failed', 'Could not generate PDF');
                        }
                    }}
                    variant="primary"
                    size="medium"
                    style={{ flex: 1 }}
                />
            </View>

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    periodSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.lg,
    },
    monthTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    overviewCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    cardTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.md,
    },
    statRow: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    stat: {
        flex: 1,
    },
    statLabel: {
        fontSize: FontSize.sm,
    },
    statValue: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        marginTop: Spacing.xs,
    },
    statHint: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    graphCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    graphPlaceholder: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    graphBars: {
        fontSize: FontSize.xxl,
        letterSpacing: 2,
    },
    graphLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: Spacing.sm,
    },
    graphLabel: {
        fontSize: FontSize.xs,
    },
    sectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    breakdownCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    breakdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    breakdownName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    breakdownSub: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    breakdownAmount: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    emptyCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    exportButton: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
    },
    exportButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
    },
    bottomPadding: {
        height: Spacing.xxl,
    },
});
