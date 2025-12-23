/**
 * Person Details Screen
 * Shows person info, current cycle, collection history, past cycles
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
    Linking,
    Pressable,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '@/constants/Colors';
import {
    getPersonById,
    getActiveCycle,
    getCollectionsByCycle,
    getCyclesByPerson,
    deletePerson,
} from '@/services/database';
import { Person, Cycle, Collection } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function PersonDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [person, setPerson] = useState<Person | null>(null);
    const [cycle, setCycle] = useState<Cycle | null>(null);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [pastCycles, setPastCycles] = useState<Cycle[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!id) return;

        try {
            const personData = await getPersonById(parseInt(id));
            setPerson(personData);

            if (personData) {
                const cycleData = await getActiveCycle(personData.id);
                setCycle(cycleData);

                if (cycleData) {
                    const collectionsData = await getCollectionsByCycle(cycleData.id);
                    setCollections(collectionsData);
                }

                const allCycles = await getCyclesByPerson(personData.id);
                setPastCycles(allCycles.filter(c => !c.isActive));
            }
        } catch (error) {
            console.error('Error loading person:', error);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const handleCall = () => {
        if (person?.phone) {
            Linking.openURL(`tel:${person.phone}`);
        }
    };

    const handleWithdrawal = () => {
        if (cycle && cycle.totalAmount > 0) {
            router.push(`/withdrawal/${person?.id}`);
        } else {
            Alert.alert('No Funds', 'No collected amount to withdraw yet.');
        }
    };

    if (!person) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
            </View>
        );
    }

    const cycleDays = cycle ?
        Math.max(1, Math.ceil((new Date().getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <>
            <Stack.Screen
                options={{
                    title: person.name,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <Pressable onPress={() => router.push(`/person/edit/${id}`)}>
                            <MaterialCommunityIcons name="pencil" size={24} color={colors.accent} />
                        </Pressable>
                    ),
                }}
            />

            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
                        <Text style={[styles.avatarText, { color: colors.accent }]}>
                            {person.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>{person.name}</Text>

                    <View style={styles.contactRow}>
                        {person.phone && (
                            <Pressable onPress={handleCall} style={styles.contactItem}>
                                <MaterialCommunityIcons name="phone" size={18} color={colors.textSecondary} />
                                <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                                    {person.phone}
                                </Text>
                            </Pressable>
                        )}
                        {person.location && (
                            <View style={styles.contactItem}>
                                <MaterialCommunityIcons name="map-marker" size={18} color={colors.textSecondary} />
                                <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                                    {person.location}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.defaultAmount, { color: colors.textMuted }]}>
                        Default: {formatCurrency(person.defaultAmount)}/day
                    </Text>
                </View>

                {/* Current Cycle */}
                <Card style={styles.cycleCard}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                        CURRENT CYCLE
                    </Text>

                    <View style={styles.cycleInfo}>
                        <Text style={[styles.cycleDate, { color: colors.text }]}>
                            Started: {cycle ? formatDate(cycle.startDate) : 'N/A'}
                        </Text>
                        <Text style={[styles.cycleDays, { color: colors.textMuted }]}>
                            {cycleDays} days
                        </Text>
                    </View>

                    <View style={[styles.totalBox, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
                            Total Collected
                        </Text>
                        <Text style={[styles.totalAmount, { color: colors.success }]}>
                            {formatCurrency(cycle?.totalAmount || 0)}
                        </Text>
                    </View>

                    <Button
                        title="💰 Process Withdrawal"
                        onPress={handleWithdrawal}
                        variant="primary"
                        size="large"
                        fullWidth
                    />

                    <Button
                        title="⚙️ Adjust Cycle"
                        onPress={() => router.push(`/person/adjust/${person.id}`)}
                        variant="secondary"
                        size="small"
                        fullWidth
                        style={{ marginTop: Spacing.sm }}
                    />
                </Card>

                {/* Collection History */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, paddingHorizontal: Spacing.lg }]}>
                    COLLECTION HISTORY
                </Text>

                <View style={styles.historyList}>
                    {collections.length === 0 ? (
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            No collections yet
                        </Text>
                    ) : (
                        collections.slice(0, 10).map((collection) => (
                            <View
                                key={collection.id}
                                style={[styles.historyItem, { borderBottomColor: colors.divider }]}
                            >
                                <View>
                                    <Text style={[styles.historyDate, { color: colors.text }]}>
                                        {formatDate(collection.date)}
                                    </Text>
                                </View>
                                <View style={styles.historyRight}>
                                    {collection.status === 'collected' ? (
                                        <>
                                            <Text style={[styles.historyAmount, { color: colors.success }]}>
                                                {formatCurrency(collection.amount || 0)}
                                            </Text>
                                            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                                        </>
                                    ) : (
                                        <>
                                            <Text style={[styles.historySkipped, { color: colors.textMuted }]}>
                                                Skipped
                                            </Text>
                                            <MaterialCommunityIcons name="skip-next-circle" size={18} color={colors.textMuted} />
                                        </>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Past Cycles */}
                {pastCycles.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }]}>
                            PAST CYCLES
                        </Text>

                        {pastCycles.map((pastCycle) => (
                            <Card key={pastCycle.id} style={StyleSheet.flatten([styles.pastCycleCard, { marginHorizontal: Spacing.lg }])}>
                                <View style={styles.pastCycleHeader}>
                                    <Text style={[styles.pastCycleTitle, { color: colors.text }]}>
                                        {formatDate(pastCycle.startDate)} - {pastCycle.endDate ? formatDate(pastCycle.endDate) : 'N/A'}
                                    </Text>
                                    <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                                </View>
                                <Text style={[styles.pastCycleAmount, { color: colors.accent }]}>
                                    Total: {formatCurrency(pastCycle.totalAmount)} ✅ Withdrawn
                                </Text>
                            </Card>
                        ))}
                    </>
                )}

                {/* Delete Person */}
                <View style={styles.deleteSection}>
                    <Button
                        title="🗑️ Delete Person"
                        onPress={() => {
                            Alert.alert(
                                'Delete Person',
                                `Are you sure you want to delete ${person.name}? This will remove all their data including collection history.`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                        text: 'Delete',
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                await deletePerson(person.id);
                                                Alert.alert('Deleted', `${person.name} has been removed.`, [
                                                    { text: 'OK', onPress: () => router.back() }
                                                ]);
                                            } catch (error) {
                                                console.error('Error deleting:', error);
                                                Alert.alert('Error', 'Failed to delete person');
                                            }
                                        },
                                    },
                                ]
                            );
                        }}
                        variant="ghost"
                        size="medium"
                        fullWidth
                    />
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 100,
        fontSize: FontSize.md,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: FontSize.display,
        fontWeight: FontWeight.bold,
    },
    name: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.sm,
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    contactText: {
        fontSize: FontSize.sm,
    },
    defaultAmount: {
        fontSize: FontSize.md,
    },
    cycleCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.md,
    },
    cycleInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    cycleDate: {
        fontSize: FontSize.md,
    },
    cycleDays: {
        fontSize: FontSize.md,
    },
    totalBox: {
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    totalLabel: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.xs,
    },
    totalAmount: {
        fontSize: FontSize.display,
        fontWeight: FontWeight.bold,
    },
    historyList: {
        paddingHorizontal: Spacing.lg,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    historyDate: {
        fontSize: FontSize.md,
    },
    historyRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    historyAmount: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    historySkipped: {
        fontSize: FontSize.sm,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: Spacing.xl,
        fontSize: FontSize.md,
    },
    pastCycleCard: {
        marginBottom: Spacing.sm,
    },
    pastCycleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    pastCycleTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    pastCycleAmount: {
        fontSize: FontSize.sm,
    },
    deleteSection: {
        marginTop: Spacing.xl,
        marginHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    bottomPadding: {
        height: Spacing.xxl,
    },
});
