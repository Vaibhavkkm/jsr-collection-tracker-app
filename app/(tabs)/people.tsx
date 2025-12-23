/**
 * People List Screen
 * Shows all registered people with search
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    TextInput,
    RefreshControl,
    useColorScheme,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '@/constants/Colors';
import { getAllPeople, deletePerson, getActiveCycle } from '@/services/database';
import { Person } from '@/types';
import Button from '@/components/ui/Button';

export default function PeopleScreen() {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [people, setPeople] = useState<Person[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadPeople = useCallback(async () => {
        try {
            const data = await getAllPeople();
            setPeople(data);
        } catch (error) {
            console.error('Error loading people:', error);
        }
    }, []);

    useEffect(() => {
        loadPeople();
    }, [loadPeople]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPeople();
        setRefreshing(false);
    }, [loadPeople]);

    const handleDelete = (person: Person) => {
        Alert.alert(
            'Delete Person',
            `Are you sure you want to remove ${person.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePerson(person.id);
                            await loadPeople();
                        } catch (error) {
                            console.error('Error deleting:', error);
                        }
                    },
                },
            ]
        );
    };

    const filteredPeople = people.filter(person =>
        person.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    const renderPerson = ({ item }: { item: Person }) => (
        <Pressable
            onPress={() => router.push(`/person/${item.id}`)}
            style={[
                styles.personCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                Shadows.small,
            ]}
        >
            <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.accent }]}>
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.personInfo}>
                <Text style={[styles.personName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.personDetails, { color: colors.textSecondary }]}>
                    Default: {formatCurrency(item.defaultAmount)}
                </Text>
                {item.location && (
                    <Text style={[styles.personLocation, { color: colors.textMuted }]}>
                        📍 {item.location}
                    </Text>
                )}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </Pressable>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search by name..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* List */}
            <FlatList
                data={filteredPeople}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPerson}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="account-off" size={48} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                            {searchQuery ? 'No people found' : 'No people added yet'}
                        </Text>
                    </View>
                }
            />

            {/* FAB */}
            <Pressable
                onPress={() => router.push('/person/add')}
                style={[styles.fab, { backgroundColor: colors.accent }]}
            >
                <MaterialCommunityIcons name="plus" size={28} color={colors.buttonPrimaryText} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: Spacing.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontSize: FontSize.md,
        height: 40,
    },
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 100,
    },
    personCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    personInfo: {
        flex: 1,
    },
    personName: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    personDetails: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    personLocation: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
    },
    emptyText: {
        fontSize: FontSize.md,
        marginTop: Spacing.md,
    },
    fab: {
        position: 'absolute',
        bottom: Spacing.lg,
        right: Spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.large,
    },
});
