/**
 * Collection Success Modal
 * Shows after recording a collection with SMS receipt option
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    useColorScheme,
    Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadows } from '@/constants/Colors';
import { sendCollectionReceipt, getSmsButtonText } from '@/services/sms';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type SmsState = 'ready' | 'sending' | 'sent' | 'failed' | 'noPhone' | 'unavailable';

interface CollectionSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    personName: string;
    personPhone?: string;
    amount: number;
    cycleTotal: number;
    date: string;
}

export function CollectionSuccessModal({
    visible,
    onClose,
    personName,
    personPhone,
    amount,
    cycleTotal,
    date,
}: CollectionSuccessModalProps) {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];

    const [smsState, setSmsState] = useState<SmsState>('ready');

    useEffect(() => {
        if (visible) {
            setSmsState('ready');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, [visible]);

    const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleSendSms = async () => {
        if (!personPhone) {
            Alert.alert('No Phone Number', 'Please add a phone number for this person to send SMS receipts.');
            return;
        }

        setSmsState('sending');

        const result = await sendCollectionReceipt(
            personPhone,
            personName,
            amount,
            cycleTotal,
            date
        );

        switch (result.status) {
            case 'success':
                setSmsState('sent');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                break;
            case 'cancelled':
                setSmsState('ready');
                break;
            case 'noPhone':
                setSmsState('noPhone');
                break;
            case 'unavailable':
                setSmsState('unavailable');
                Alert.alert('SMS Unavailable', 'SMS is not available on this device.');
                break;
            case 'error':
                setSmsState('failed');
                Alert.alert('SMS Failed', result.message);
                break;
        }
    };

    const getSmsButtonVariant = (): 'primary' | 'secondary' | 'success' | 'skip' => {
        switch (smsState) {
            case 'sent':
                return 'success';
            case 'failed':
                return 'skip';
            default:
                return 'secondary';
        }
    };

    const hasPhone = !!personPhone && personPhone.trim() !== '';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    {/* Success Checkmark */}
                    <View style={[styles.checkCircle, { backgroundColor: colors.success }]}>
                        <MaterialCommunityIcons name="check" size={40} color="#fff" />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>
                        Collection Recorded!
                    </Text>

                    {/* Details Card */}
                    <Card style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{personName}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
                            <Text style={[styles.value, { color: colors.success }]}>{formatCurrency(amount)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{formatDate(date)}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <View style={styles.detailRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Cycle Total</Text>
                            <Text style={[styles.cycleTotal, { color: colors.accent }]}>{formatCurrency(cycleTotal)}</Text>
                        </View>
                    </Card>

                    {/* SMS Button */}
                    <Button
                        title={getSmsButtonText(smsState, hasPhone)}
                        onPress={handleSendSms}
                        variant={getSmsButtonVariant()}
                        size="large"
                        fullWidth
                        disabled={smsState === 'sending' || smsState === 'sent' || smsState === 'unavailable'}
                        style={styles.smsButton}
                    />

                    {/* Done Button */}
                    <Button
                        title="Done"
                        onPress={onClose}
                        variant="ghost"
                        size="medium"
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        ...Shadows.large,
    },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.lg,
    },
    detailsCard: {
        width: '100%',
        marginBottom: Spacing.lg,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    label: {
        fontSize: FontSize.sm,
    },
    value: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.sm,
    },
    cycleTotal: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    smsButton: {
        marginBottom: Spacing.md,
    },
});

export default CollectionSuccessModal;
