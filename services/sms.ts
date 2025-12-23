/**
 * SMS Service for Collection Tracker
 * Sends SMS receipts for collections and withdrawals
 * 
 * Note: In React Native Expo, we use expo-sms which opens the SMS app
 * For production, native modules or a backend service would be needed
 * for background SMS sending without opening the SMS app.
 */

import * as SMS from 'expo-sms';

export type SmsResult =
    | { status: 'success' }
    | { status: 'cancelled' }
    | { status: 'noPhone' }
    | { status: 'unavailable' }
    | { status: 'error'; message: string };

/**
 * Check if SMS is available on this device
 */
export async function isSmsAvailable(): Promise<boolean> {
    return await SMS.isAvailableAsync();
}

/**
 * Format amount with Indian Rupee formatting
 */
function formatAmount(amount: number): string {
    return amount.toLocaleString('en-IN');
}

/**
 * Format date for SMS
 */
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Build collection receipt SMS message
 */
export function buildCollectionMessage(
    personName: string,
    amount: number,
    cycleTotal: number,
    date: string
): string {
    return `JSR Collection

Name: ${personName}
Date: ${formatDate(date)}
Amount: ₹${formatAmount(amount)}

Cycle Total: ₹${formatAmount(cycleTotal)}

Thank you!`;
}

/**
 * Build withdrawal receipt SMS message
 */
export function buildWithdrawalMessage(
    personName: string,
    withdrawalAmount: number,
    startDate: string,
    endDate: string,
    totalDays: number
): string {
    return `JSR Withdrawal

Name: ${personName}
Date: ${formatDate(endDate)}
Amount Withdrawn: ₹${formatAmount(withdrawalAmount)}

Cycle: ${formatDate(startDate)} to ${formatDate(endDate)}
Days: ${totalDays}

New cycle started. Thank you!`;
}

/**
 * Send collection receipt SMS
 * Opens SMS app with pre-filled message
 */
export async function sendCollectionReceipt(
    phoneNumber: string | undefined,
    personName: string,
    amount: number,
    cycleTotal: number,
    date: string
): Promise<SmsResult> {
    // Check if phone number exists
    if (!phoneNumber || phoneNumber.trim() === '') {
        return { status: 'noPhone' };
    }

    // Check if SMS is available
    const available = await isSmsAvailable();
    if (!available) {
        return { status: 'unavailable' };
    }

    try {
        const message = buildCollectionMessage(personName, amount, cycleTotal, date);

        // Format phone number (add country code if needed)
        const formattedPhone = formatPhoneNumber(phoneNumber);

        const { result } = await SMS.sendSMSAsync([formattedPhone], message);

        if (result === 'sent') {
            return { status: 'success' };
        } else if (result === 'cancelled') {
            return { status: 'cancelled' };
        } else {
            return { status: 'error', message: 'Unknown error occurred' };
        }
    } catch (error: any) {
        return { status: 'error', message: error.message || 'Failed to send SMS' };
    }
}

/**
 * Send withdrawal receipt SMS
 * Opens SMS app with pre-filled message
 */
export async function sendWithdrawalReceipt(
    phoneNumber: string | undefined,
    personName: string,
    withdrawalAmount: number,
    startDate: string,
    endDate: string,
    totalDays: number
): Promise<SmsResult> {
    // Check if phone number exists
    if (!phoneNumber || phoneNumber.trim() === '') {
        return { status: 'noPhone' };
    }

    // Check if SMS is available
    const available = await isSmsAvailable();
    if (!available) {
        return { status: 'unavailable' };
    }

    try {
        const message = buildWithdrawalMessage(
            personName,
            withdrawalAmount,
            startDate,
            endDate,
            totalDays
        );

        const formattedPhone = formatPhoneNumber(phoneNumber);

        const { result } = await SMS.sendSMSAsync([formattedPhone], message);

        if (result === 'sent') {
            return { status: 'success' };
        } else if (result === 'cancelled') {
            return { status: 'cancelled' };
        } else {
            return { status: 'error', message: 'Unknown error occurred' };
        }
    } catch (error: any) {
        return { status: 'error', message: error.message || 'Failed to send SMS' };
    }
}

/**
 * Format phone number with country code
 * Assumes Indian phone numbers by default
 */
function formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // If number starts with 91 and is 12 digits, it already has country code
    if (digits.startsWith('91') && digits.length === 12) {
        return `+${digits}`;
    }

    // If 10 digits, add +91 prefix
    if (digits.length === 10) {
        return `+91${digits}`;
    }

    // Return as-is if format is unknown
    return phone;
}

/**
 * Get SMS button text based on state
 */
export function getSmsButtonText(
    state: 'ready' | 'sending' | 'sent' | 'failed' | 'noPhone' | 'unavailable',
    hasPhone: boolean
): string {
    switch (state) {
        case 'ready':
            return hasPhone ? '📱 Send SMS Receipt' : '📱 Add phone to send SMS';
        case 'sending':
            return '📱 Opening SMS...';
        case 'sent':
            return '✅ SMS Sent!';
        case 'failed':
            return '❌ Failed - Tap to Retry';
        case 'noPhone':
            return '📱 Add phone number first';
        case 'unavailable':
            return '📱 SMS not available';
        default:
            return '📱 Send SMS Receipt';
    }
}
