/**
 * Settings Screen
 * App preferences and data management
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    useColorScheme,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/Colors';
import { exportAndShareDatabaseBackup, importDatabaseFromJSON } from '@/services/export';

const BACKUP_DATE_KEY = 'last_backup_date';

export default function SettingsScreen() {
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const [isExporting, setIsExporting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
    const [daysSinceBackup, setDaysSinceBackup] = useState<number>(0);

    useEffect(() => {
        loadLastBackupDate();
    }, []);

    const loadLastBackupDate = async () => {
        try {
            const date = await AsyncStorage.getItem(BACKUP_DATE_KEY);
            if (date) {
                setLastBackupDate(date);
                const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
                setDaysSinceBackup(days);
            } else {
                setDaysSinceBackup(999); // Never backed up
            }
        } catch (e) {
            console.error('Error loading backup date:', e);
        }
    };

    const saveBackupDate = async () => {
        try {
            const date = new Date().toISOString();
            await AsyncStorage.setItem(BACKUP_DATE_KEY, date);
            setLastBackupDate(date);
            setDaysSinceBackup(0);
        } catch (e) {
            console.error('Error saving backup date:', e);
        }
    };

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            await exportAndShareDatabaseBackup();
            await saveBackupDate(); // Mark backup as done
            Alert.alert('Backup Created!', 'Remember to save the file to Google Drive or Files for safekeeping.');
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Export Failed', 'Could not export data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleRestoreData = async () => {
        Alert.alert(
            '⚠️ Restore from Backup',
            'This will REPLACE all existing data with the backup. Current data will be deleted. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Choose File',
                    onPress: async () => {
                        setIsRestoring(true);
                        try {
                            const result = await DocumentPicker.getDocumentAsync({
                                type: 'application/json',
                                copyToCacheDirectory: true,
                            });

                            if (!result.canceled && result.assets && result.assets[0]) {
                                const fileUri = result.assets[0].uri;
                                const content = await FileSystem.readAsStringAsync(fileUri);
                                const { imported } = await importDatabaseFromJSON(content);

                                Alert.alert(
                                    'Restore Complete!',
                                    `Successfully imported ${imported} people. Restart the app to see the changes.`
                                );
                            }
                        } catch (error) {
                            console.error('Restore error:', error);
                            Alert.alert('Restore Failed', 'Could not restore data. Make sure you selected a valid JSR backup file.');
                        } finally {
                            setIsRestoring(false);
                        }
                    }
                }
            ]
        );
    };

    const formatBackupDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const SettingItem = ({
        icon,
        title,
        subtitle,
        onPress,
        loading = false,
    }: any) => (
        <Pressable
            onPress={onPress}
            disabled={loading}
            style={[styles.settingItem, { borderBottomColor: colors.divider }]}
        >
            <View style={styles.settingLeft}>
                <MaterialCommunityIcons name={icon} size={24} color={colors.accent} />
                <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                        {loading ? 'Processing...' : title}
                    </Text>
                    {subtitle && (
                        <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
                    )}
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </Pressable>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>
    );

    const needsBackup = daysSinceBackup >= 7;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Backup Reminder Banner */}
            {needsBackup && (
                <Pressable
                    style={[styles.reminderBanner, { backgroundColor: colors.warning + '20' }]}
                    onPress={handleExportData}
                >
                    <MaterialCommunityIcons name="alert" size={24} color={colors.warning} />
                    <View style={styles.reminderText}>
                        <Text style={[styles.reminderTitle, { color: colors.warning }]}>
                            {lastBackupDate ? `Last backup: ${formatBackupDate(lastBackupDate)}` : 'Never backed up!'}
                        </Text>
                        <Text style={[styles.reminderSubtitle, { color: colors.textMuted }]}>
                            Tap to backup now →
                        </Text>
                    </View>
                </Pressable>
            )}

            <SectionHeader title="DATA & BACKUP" />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <SettingItem
                    icon="export"
                    title="Export All Data"
                    subtitle={lastBackupDate ? `Last: ${formatBackupDate(lastBackupDate)}` : 'Never backed up'}
                    onPress={handleExportData}
                    loading={isExporting}
                />
                <SettingItem
                    icon="cloud-download"
                    title="Restore from Backup"
                    subtitle="Import from JSR backup file"
                    onPress={handleRestoreData}
                    loading={isRestoring}
                />
            </View>

            <SectionHeader title="ABOUT" />
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <SettingItem
                    icon="information"
                    title="App Version"
                    subtitle="1.0.0"
                    onPress={() => { }}
                />
                <SettingItem
                    icon="email"
                    title="Contact Support"
                    subtitle="vaibhavkkm@zohomail.in"
                    onPress={() => Alert.alert('Support', 'Email: vaibhavkkm@zohomail.in')}
                />
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={[styles.instructionTitle, { color: colors.textSecondary }]}>
                    📋 Backup Guide:
                </Text>
                <Text style={[styles.instructionText, { color: colors.textMuted }]}>
                    • Export weekly to keep data safe{'\n'}
                    • Save backup to Google Drive/Files{'\n'}
                    • To restore: Select your .json file
                </Text>
            </View>

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    reminderBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    reminderText: {
        flex: 1,
    },
    reminderTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    reminderSubtitle: {
        fontSize: FontSize.xs,
    },
    sectionHeader: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        marginHorizontal: Spacing.lg,
    },
    section: {
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingText: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    settingTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    settingSubtitle: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    instructions: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.xl,
        padding: Spacing.md,
    },
    instructionTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.sm,
    },
    instructionText: {
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    bottomPadding: {
        height: Spacing.xxl,
    },
});
