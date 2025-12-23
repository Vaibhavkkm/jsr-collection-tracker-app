/**
 * Add Person Screen
 * Form to add new collection person
 */

import React, { useState } from 'react';
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
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/Colors';
import { addPerson } from '@/services/database';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function AddPersonScreen() {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [defaultAmount, setDefaultAmount] = useState('');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        // Validation
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
            await addPerson({
                name: name.trim(),
                phone: phone.trim() || undefined,
                location: location.trim() || undefined,
                defaultAmount: parseInt(defaultAmount),
                frequency,
                notes: notes.trim() || undefined,
                isActive: true,
            });

            Alert.alert('Success', `${name} has been added!`, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error saving person:', error);
            Alert.alert('Error', 'Failed to save person');
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

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Add New Person',
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
                        {/* Photo (Placeholder) */}
                        <View style={[styles.photoContainer, { backgroundColor: colors.surfaceElevated }]}>
                            <MaterialCommunityIcons name="camera-plus" size={32} color={colors.textMuted} />
                            <Text style={[styles.photoText, { color: colors.textMuted }]}>
                                Add Photo (optional)
                            </Text>
                        </View>

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
                        <Text style={[styles.hint, { color: colors.textMuted }]}>
                            This amount will show as quick collect button
                        </Text>

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
                            title={saving ? 'Saving...' : 'Save Person'}
                            onPress={handleSave}
                            variant="primary"
                            size="large"
                            fullWidth
                            disabled={saving}
                            style={styles.saveButton}
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
    content: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    photoContainer: {
        height: 120,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    photoText: {
        fontSize: FontSize.sm,
        marginTop: Spacing.sm,
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
    hint: {
        fontSize: FontSize.xs,
        marginTop: -Spacing.sm,
        marginBottom: Spacing.md,
    },
    frequencyRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    saveButton: {
        marginTop: Spacing.lg,
    },
});
