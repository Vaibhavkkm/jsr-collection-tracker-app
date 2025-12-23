/**
 * Withdrawal Flow Screen
 * Process full or partial (date-based) withdrawal for a person
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    useColorScheme,
    Alert,
    Pressable,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '@/constants/Colors';
import {
    getPersonById,
    getActiveCycle,
    processWithdrawal,
    processPartialWithdrawal,
    getCollectionsTotalByDate
} from '@/services/database';
import { Person, Cycle } from '@/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type WithdrawalType = 'full' | 'partial';

export default function WithdrawalScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [person, setPerson] = useState<Person | null>(null);
    const [cycle, setCycle] = useState<Cycle | null>(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('full');
    const [tillDate, setTillDate] = useState(''); // DD-MM-YYYY format
    const [calculatedAmount, setCalculatedAmount] = useState(0);
    const [calculating, setCalculating] = useState(false);

    const checkScale = useSharedValue(0);
    const checkOpacity = useSharedValue(0);

    const checkAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
        opacity: checkOpacity.value,
    }));

    const loadData = useCallback(async () => {
        if (!id) return;

        try {
            const personData = await getPersonById(parseInt(id));
            setPerson(personData);

            if (personData) {
                const cycleData = await getActiveCycle(personData.id);
                setCycle(cycleData);
            }
        } catch (error) {
            console.error('Error loading:', error);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Format date input automatically
    const handleDateChange = (text: string) => {
        // Remove non-numeric characters
        const cleaned = text.replace(/[^0-9]/g, '');

        // Auto-insert hyphens
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
        }
        if (cleaned.length > 4) {
            formatted = formatted.slice(0, 5) + '-' + cleaned.slice(4);
        }

        // Max length 10 (DD-MM-YYYY)
        if (formatted.length > 10) {
            formatted = formatted.slice(0, 10);
        }

        setTillDate(formatted);
    };

    // Calculate amount when date changes
    useEffect(() => {
        const calculateAmount = async () => {
            if (!person || !cycle || !tillDate || withdrawalType !== 'partial') {
                setCalculatedAmount(0);
                return;
            }

            // Validate date format DD-MM-YYYY
            if (!/^\d{2}-\d{2}-\d{4}$/.test(tillDate)) {
                setCalculatedAmount(0);
                return;
            }

            const [day, month, year] = tillDate.split('-');
            const isoDate = `${year}-${month}-${day}`;

            // Validate the date
            const dateObj = new Date(isoDate);
            if (isNaN(dateObj.getTime())) {
                setCalculatedAmount(0);
                return;
            }

            setCalculating(true);
            try {
                const total = await getCollectionsTotalByDate(person.id, cycle.startDate, isoDate);
                setCalculatedAmount(total);
            } catch (error) {
                console.error('Error calculating:', error);
                setCalculatedAmount(0);
            }
            setCalculating(false);
        };

        if (tillDate.length === 10) {
            calculateAmount();
        } else {
            setCalculatedAmount(0);
        }
    }, [tillDate, person, cycle, withdrawalType]);

    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateToDDMMYYYY = (isoDate: string) => {
        const [year, month, day] = isoDate.split('-');
        return `${day}-${month}-${year}`;
    };

    const handleConfirmWithdrawal = async () => {
        if (!person || !cycle) return;

        const amount = withdrawalType === 'full'
            ? cycle.totalAmount
            : calculatedAmount;

        if (amount <= 0) {
            Alert.alert('Error', 'No amount to withdraw for selected period');
            return;
        }

        if (amount > cycle.totalAmount) {
            Alert.alert('Error', 'Amount exceeds cycle total');
            return;
        }

        setProcessing(true);

        try {
            if (withdrawalType === 'full') {
                await processWithdrawal(person.id);
            } else {
                await processPartialWithdrawal(person.id, amount, `Withdrawal till ${tillDate}`);
            }

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Show success animation
            setSuccess(true);
            checkScale.value = withSequence(
                withSpring(1.2, { damping: 10, stiffness: 100 }),
                withSpring(1, { damping: 10, stiffness: 100 })
            );
            checkOpacity.value = withSpring(1);

            // Navigate back after delay
            const remaining = cycle.totalAmount - amount;
            setTimeout(() => {
                Alert.alert(
                    'Withdrawal Processed!',
                    withdrawalType === 'full'
                        ? `${formatCurrency(amount)} has been withdrawn.\nNew cycle started.`
                        : `${formatCurrency(amount)} withdrawn (till ${tillDate}).\nRemaining: ${formatCurrency(remaining)}`,
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            }, 1500);

        } catch (error) {
            console.error('Error processing withdrawal:', error);
            Alert.alert('Error', 'Failed to process withdrawal');
            setProcessing(false);
        }
    };

    const cycleDays = cycle
        ? Math.max(1, Math.ceil((new Date().getTime() - new Date(cycle.startDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    if (!person || !cycle) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <Stack.Screen
                options={{
                    title: 'Process Withdrawal',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={() => Keyboard.dismiss()}
            >
                {success ? (
                    <View style={styles.successContainer}>
                        <Animated.View style={[styles.successCircle, { backgroundColor: colors.success }, checkAnimatedStyle]}>
                            <MaterialCommunityIcons name="check" size={64} color="#fff" />
                        </Animated.View>
                        <Text style={[styles.successText, { color: colors.text }]}>
                            Withdrawal Processed!
                        </Text>
                        <Text style={[styles.successSubtext, { color: colors.textSecondary }]}>
                            {withdrawalType === 'full' ? 'New cycle started' : 'Cycle continues'}
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Header */}
                        <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
                            <MaterialCommunityIcons name="cash-multiple" size={48} color={colors.accent} />
                        </View>

                        <Text style={[styles.title, { color: colors.text }]}>
                            💰 Process Withdrawal
                        </Text>

                        {/* Person Card */}
                        <Card style={styles.personCard}>
                            <Text style={[styles.personName, { color: colors.text }]}>
                                {person.name}
                            </Text>
                        </Card>

                        {/* Cycle Details */}
                        <View style={styles.detailsContainer}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                Cycle: {formatDate(cycle.startDate)} → Today ({cycleDays} days)
                            </Text>
                        </View>

                        {/* Total Amount Box */}
                        <View style={[styles.amountBox, { backgroundColor: colors.surfaceElevated }]}>
                            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                                Total in Cycle
                            </Text>
                            <Text style={[styles.amountValue, { color: colors.success }]}>
                                {formatCurrency(cycle.totalAmount)}
                            </Text>
                        </View>

                        {/* Withdrawal Type Selection */}
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                            WITHDRAWAL TYPE
                        </Text>

                        <View style={styles.typeSelection}>
                            <Pressable
                                style={[
                                    styles.typeOption,
                                    {
                                        backgroundColor: withdrawalType === 'full' ? colors.accent + '20' : colors.surface,
                                        borderColor: withdrawalType === 'full' ? colors.accent : colors.cardBorder,
                                    }
                                ]}
                                onPress={() => setWithdrawalType('full')}
                            >
                                <MaterialCommunityIcons
                                    name={withdrawalType === 'full' ? 'radiobox-marked' : 'radiobox-blank'}
                                    size={24}
                                    color={withdrawalType === 'full' ? colors.accent : colors.textMuted}
                                    accessibilityLabel="Select Full Withdrawal"
                                />
                                <View style={styles.typeText}>
                                    <Text style={[styles.typeTitle, { color: colors.text }]}>Full Withdrawal</Text>
                                    <Text style={[styles.typeDesc, { color: colors.textMuted }]}>
                                        Withdraw full {formatCurrency(cycle.totalAmount)}, close & restart cycle
                                    </Text>
                                </View>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.typeOption,
                                    {
                                        backgroundColor: withdrawalType === 'partial' ? colors.accent + '20' : colors.surface,
                                        borderColor: withdrawalType === 'partial' ? colors.accent : colors.cardBorder,
                                    }
                                ]}
                                onPress={() => setWithdrawalType('partial')}
                            >
                                <MaterialCommunityIcons
                                    name={withdrawalType === 'partial' ? 'radiobox-marked' : 'radiobox-blank'}
                                    size={24}
                                    color={withdrawalType === 'partial' ? colors.accent : colors.textMuted}
                                    accessibilityLabel="Select Partial Withdrawal"
                                />
                                <View style={styles.typeText}>
                                    <Text style={[styles.typeTitle, { color: colors.text }]}>Partial (Till Date)</Text>
                                    <Text style={[styles.typeDesc, { color: colors.textMuted }]}>
                                        Withdraw collections till a specific date, cycle continues
                                    </Text>
                                </View>
                            </Pressable>
                        </View>

                        {/* Date Input for Partial */}
                        {withdrawalType === 'partial' && (
                            <View style={styles.partialInput}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                    Withdraw collections till date:
                                </Text>
                                <TextInput
                                    style={[
                                        styles.dateInput,
                                        {
                                            backgroundColor: colors.surface,
                                            borderColor: colors.cardBorder,
                                            color: colors.text
                                        }
                                    ]}
                                    placeholder="DD-MM-YYYY"
                                    placeholderTextColor={colors.textMuted}
                                    value={tillDate}
                                    onChangeText={handleDateChange}
                                    keyboardType="numeric"
                                    maxLength={10}
                                    returnKeyType="done"
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                    blurOnSubmit={true}
                                />
                                <Text style={[styles.dateHint, { color: colors.textMuted }]}>
                                    Cycle started: {formatDateToDDMMYYYY(cycle.startDate)}
                                </Text>

                                {calculating ? (
                                    <Text style={[styles.calculatedAmount, { color: colors.textMuted }]}>
                                        Calculating...
                                    </Text>
                                ) : calculatedAmount > 0 ? (
                                    <View style={[styles.calculatedBox, { backgroundColor: colors.success + '20' }]}>
                                        <Text style={[styles.calculatedLabel, { color: colors.textSecondary }]}>
                                            Amount till {tillDate}:
                                        </Text>
                                        <Text style={[styles.calculatedValue, { color: colors.success }]}>
                                            {formatCurrency(calculatedAmount)}
                                        </Text>
                                        <Text style={[styles.remainingText, { color: colors.textMuted }]}>
                                            Remaining in cycle: {formatCurrency(cycle.totalAmount - calculatedAmount)}
                                        </Text>
                                    </View>
                                ) : tillDate.length === 10 ? (
                                    <Text style={[styles.noAmount, { color: colors.warning }]}>
                                        No collections found for this date range
                                    </Text>
                                ) : null}
                            </View>
                        )}

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Button
                                title={withdrawalType === 'full'
                                    ? `✓ Withdraw ${formatCurrency(cycle.totalAmount)}`
                                    : calculatedAmount > 0
                                        ? `✓ Withdraw ${formatCurrency(calculatedAmount)}`
                                        : '✓ Confirm Withdrawal'}
                                onPress={handleConfirmWithdrawal}
                                variant="success"
                                size="large"
                                fullWidth
                                disabled={processing || (withdrawalType === 'partial' && calculatedAmount <= 0)}
                            />
                            <Button
                                title="Cancel"
                                onPress={() => router.back()}
                                variant="ghost"
                                size="medium"
                                fullWidth
                                disabled={processing}
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.lg,
        paddingBottom: 120, // Increased bottom padding for scroll visibility
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 100,
        fontSize: FontSize.md,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: Spacing.md,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        textAlign: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.md,
    },
    personCard: {
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    personName: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    detailsContainer: {
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    detailLabel: {
        fontSize: FontSize.sm,
    },
    amountBox: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    amountLabel: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.xs,
    },
    amountValue: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    sectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        marginBottom: Spacing.md,
    },
    typeSelection: {
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    typeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        gap: Spacing.sm,
    },
    typeText: {
        flex: 1,
    },
    typeTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    typeDesc: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    partialInput: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
    },
    dateInput: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: FontSize.lg,
        textAlign: 'center',
    },
    dateHint: {
        fontSize: FontSize.xs,
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
    calculatedBox: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    calculatedLabel: {
        fontSize: FontSize.sm,
    },
    calculatedValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        marginTop: Spacing.xs,
    },
    calculatedAmount: {
        fontSize: FontSize.md,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
    remainingText: {
        fontSize: FontSize.sm,
        marginTop: Spacing.xs,
    },
    noAmount: {
        fontSize: FontSize.sm,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
    actions: {
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    successCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    successText: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.sm,
    },
    successSubtext: {
        fontSize: FontSize.md,
    },
});
