/**
 * Adjust Cycle Screen
 * Allows manual adjustment of cycle total and start date
 * For when app is released late and historical data needs entry
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    useColorScheme,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/Colors';
import { getPersonById, getActiveCycle, updateCycleData } from '@/services/database';
import { Person, Cycle } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function AdjustCycleScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [person, setPerson] = useState<Person | null>(null);
    const [cycle, setCycle] = useState<Cycle | null>(null);
    const [totalAmount, setTotalAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Convert YYYY-MM-DD to DD-MM-YYYY for display
    const toDisplayDate = (isoDate: string) => {
        const [year, month, day] = isoDate.split('-');
        return `${day}-${month}-${year}`;
    };

    const loadData = useCallback(async () => {
        if (!id) return;
        try {
            const personData = await getPersonById(parseInt(id));
            if (personData) {
                setPerson(personData);
                const cycleData = await getActiveCycle(personData.id);
                if (cycleData) {
                    setCycle(cycleData);
                    setTotalAmount(cycleData.totalAmount.toString());
                    // Convert to DD-MM-YYYY format for display
                    setStartDate(toDisplayDate(cycleData.startDate));
                }
            }
        } catch (error) {
            console.error('Error loading:', error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatCurrency = (val: string) => {
        const num = parseInt(val) || 0;
        return `₹${num.toLocaleString('en-IN')}`;
    };

    // Convert DD-MM-YYYY to YYYY-MM-DD for storage
    const toStorageDate = (displayDate: string) => {
        const parts = displayDate.split('-');
        if (parts.length !== 3) return null;
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    };

    const handleSave = async () => {
        if (!cycle) return;

        const amount = parseInt(totalAmount);
        if (isNaN(amount) || amount < 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        // Validate date format (DD-MM-YYYY)
        if (!/^\d{2}-\d{2}-\d{4}$/.test(startDate)) {
            Alert.alert('Error', 'Please enter date in DD-MM-YYYY format (e.g., 01-12-2025)');
            return;
        }

        // Convert to storage format
        const isoDate = toStorageDate(startDate);
        if (!isoDate) {
            Alert.alert('Error', 'Invalid date format');
            return;
        }

        setSaving(true);
        try {
            await updateCycleData(cycle.id, {
                totalAmount: amount,
                startDate: isoDate,
            });

            Alert.alert('Success', 'Cycle adjusted successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error updating cycle:', error);
            Alert.alert('Error', 'Failed to update cycle');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = [
        styles.input,
        {
            backgroundColor: colors.surface,
            borderColor: colors.cardBorder,
            color: colors.text
        }
    ];

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.textMuted }}>Loading...</Text>
            </View>
        );
    }

    if (!person || !cycle) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.error }}>No active cycle found</Text>
                <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Adjust Cycle',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView
                        style={[styles.container, { backgroundColor: colors.background }]}
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Info Card */}
                        <Card style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="account" size={24} color={colors.accent} />
                                <Text style={[styles.personName, { color: colors.text }]}>{person.name}</Text>
                            </View>
                            <Text style={[styles.infoText, { color: colors.textMuted }]}>
                                Use this to adjust the cycle when app is released late and you need to enter historical data.
                            </Text>
                        </Card>

                        {/* Current Values */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            CURRENT VALUES
                        </Text>
                        <Card style={styles.currentCard}>
                            <View style={styles.currentRow}>
                                <Text style={[styles.currentLabel, { color: colors.textMuted }]}>Current Total</Text>
                                <Text style={[styles.currentValue, { color: colors.success }]}>
                                    ₹{cycle.totalAmount.toLocaleString('en-IN')}
                                </Text>
                            </View>
                            <View style={styles.currentRow}>
                                <Text style={[styles.currentLabel, { color: colors.textMuted }]}>Start Date</Text>
                                <Text style={[styles.currentValue, { color: colors.text }]}>{cycle.startDate}</Text>
                            </View>
                        </Card>

                        {/* Edit Fields */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            NEW VALUES
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Total Collected Amount
                            </Text>
                            <TextInput
                                style={inputStyle}
                                value={totalAmount}
                                onChangeText={setTotalAmount}
                                placeholder="Enter total amount collected"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                            />
                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                Preview: {formatCurrency(totalAmount)}
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Cycle Start Date
                            </Text>
                            <TextInput
                                style={inputStyle}
                                value={startDate}
                                onChangeText={setStartDate}
                                placeholder="DD-MM-YYYY (e.g., 01-12-2025)"
                                placeholderTextColor={colors.textMuted}
                            />
                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                Format: DD-MM-YYYY
                            </Text>
                        </View>

                        {/* Warning */}
                        <View style={[styles.warningCard, { backgroundColor: colors.warning + '20' }]}>
                            <View style={styles.warningRow}>
                                <MaterialCommunityIcons name="alert" size={20} color={colors.warning} />
                                <Text style={[styles.warningText, { color: colors.warning }]}>
                                    This will directly modify the cycle data. Use carefully!
                                </Text>
                            </View>
                        </View>

                        {/* Save Button */}
                        <Button
                            title={saving ? 'Saving...' : 'Save Adjustments'}
                            onPress={handleSave}
                            variant="primary"
                            size="large"
                            fullWidth
                            disabled={saving}
                            style={styles.saveButton}
                        />

                        <Button
                            title="Cancel"
                            onPress={() => router.back()}
                            variant="ghost"
                            size="medium"
                            fullWidth
                            disabled={saving}
                        />
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    content: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    infoCard: {
        marginBottom: Spacing.lg,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    personName: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    infoText: {
        fontSize: FontSize.sm,
    },
    sectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
    },
    currentCard: {
        marginBottom: Spacing.lg,
    },
    currentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xs,
    },
    currentLabel: {
        fontSize: FontSize.sm,
    },
    currentValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSize.md,
    },
    hint: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
    },
    warningCard: {
        marginVertical: Spacing.md,
        padding: Spacing.md,
    },
    warningRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    warningText: {
        fontSize: FontSize.sm,
        flex: 1,
    },
    saveButton: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
});
