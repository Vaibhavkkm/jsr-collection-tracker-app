/**
 * Edit Person Screen
 * Form to edit existing person
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
import { getPersonById, updatePerson } from '@/services/database';
import { Person } from '@/types';
import Button from '@/components/ui/Button';

export default function EditPersonScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [person, setPerson] = useState<Person | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [defaultAmount, setDefaultAmount] = useState('');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadPerson = useCallback(async () => {
        if (!id) return;
        try {
            const data = await getPersonById(parseInt(id));
            if (data) {
                setPerson(data);
                setName(data.name);
                setPhone(data.phone || '');
                setLocation(data.location || '');
                setDefaultAmount(data.defaultAmount.toString());
                setFrequency(data.frequency);
                setNotes(data.notes || '');
            }
        } catch (error) {
            console.error('Error loading person:', error);
            Alert.alert('Error', 'Failed to load person details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadPerson();
    }, [loadPerson]);

    const handleSave = async () => {
        if (!person) return;

        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }
        if (!defaultAmount.trim() || parseInt(defaultAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid default amount');
            return;
        }

        setSaving(true);
        try {
            await updatePerson(person.id, {
                name: name.trim(),
                phone: phone.trim() || undefined,
                location: location.trim() || undefined,
                defaultAmount: parseInt(defaultAmount),
                frequency,
                notes: notes.trim() || undefined,
            });

            Alert.alert('Success', 'Person updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error updating person:', error);
            Alert.alert('Error', 'Failed to update person');
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

    if (!person) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.error }}>Person not found</Text>
                <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: `Edit ${person.name}`,
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
                        {/* Name Field */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Name <Text style={{ color: colors.error }}>*</Text>
                            </Text>
                            <TextInput
                                style={inputStyle}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter full name"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Phone Field */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Phone Number
                            </Text>
                            <TextInput
                                style={inputStyle}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="10-digit mobile number"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Location Field */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Location / Address
                            </Text>
                            <TextInput
                                style={inputStyle}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="Shop name, area, etc."
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Default Amount Field */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Default Daily Amount <Text style={{ color: colors.error }}>*</Text>
                            </Text>
                            <TextInput
                                style={inputStyle}
                                value={defaultAmount}
                                onChangeText={setDefaultAmount}
                                placeholder="₹ 200"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                            />
                        </View>

                        {/* Frequency */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Collection Frequency
                            </Text>
                            <View style={styles.frequencyRow}>
                                <Button
                                    title="Daily"
                                    onPress={() => setFrequency('daily')}
                                    variant={frequency === 'daily' ? 'primary' : 'secondary'}
                                    size="small"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Weekly"
                                    onPress={() => setFrequency('weekly')}
                                    variant={frequency === 'weekly' ? 'primary' : 'secondary'}
                                    size="small"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Custom"
                                    onPress={() => setFrequency('custom')}
                                    variant={frequency === 'custom' ? 'primary' : 'secondary'}
                                    size="small"
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>

                        {/* Notes Field */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>
                                Notes
                            </Text>
                            <TextInput
                                style={[inputStyle, styles.multilineInput]}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Any additional info..."
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Save Button */}
                        <Button
                            title={saving ? 'Saving...' : 'Save Changes'}
                            onPress={handleSave}
                            variant="primary"
                            size="large"
                            fullWidth
                            disabled={saving}
                            style={styles.saveButton}
                        />

                        {/* Cancel Button */}
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
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    frequencyRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    saveButton: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
});
