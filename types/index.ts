/**
 * TypeScript type definitions for Collection Tracker
 */

// Person (Customer who pays daily)
export interface Person {
    id: number;
    name: string;
    phone?: string;
    location?: string;
    photoPath?: string;
    defaultAmount: number;
    frequency: 'daily' | 'weekly' | 'custom';
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Collection Cycle (Period between withdrawals)
export interface Cycle {
    id: number;
    personId: number;
    startDate: string;
    endDate?: string;
    totalAmount: number;
    isActive: boolean;
    withdrawalDate?: string;
    notes?: string;
}

// Daily Collection Entry
export type CollectionStatus = 'collected' | 'skipped' | 'pending';

export interface Collection {
    id: number;
    personId: number;
    cycleId: number;
    date: string;
    amount?: number;
    status: CollectionStatus;
    notes?: string;
    createdAt: string;
}

// Withdrawal Record
export interface Withdrawal {
    id: number;
    personId: number;
    cycleId: number;
    amount: number;
    date: string;
    notes?: string;
}

// App Settings
export interface Settings {
    theme: 'dark' | 'light' | 'system';
    language: 'en' | 'hi';
    textSize: 'small' | 'medium' | 'large';
    autoBackup: boolean;
    lastBackupDate?: string;
    dailyReminderEnabled: boolean;
    dailyReminderTime: string;
    withdrawalAlertsEnabled: boolean;
    appLockEnabled: boolean;
}

// Dashboard Summary
export interface DashboardSummary {
    todayCollected: number;
    todayCount: number;
    pendingCount: number;
    pendingEstimate: number;
    monthTotal: number;
    monthChange: number;
}

// Person with today's collection status (for dashboard list)
export interface PersonWithStatus extends Person {
    todayStatus: CollectionStatus;
    todayAmount?: number;
    cycleTotal: number;
    cycleId?: number;
}

// Report Data
export interface MonthlyReport {
    month: string;
    year: number;
    totalCollected: number;
    collectionDays: number;
    averagePerDay: number;
    withdrawalCount: number;
    withdrawalAmount: number;
    personBreakdown: PersonBreakdown[];
}

export interface PersonBreakdown {
    personId: number;
    name: string;
    totalCollected: number;
    collectionRate: number; // percentage of days collected
}

// Navigation params
export interface PersonDetailParams {
    id: string;
}

export interface WithdrawalParams {
    personId: string;
}
