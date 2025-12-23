/**
 * Home Dashboard Screen
 * Main screen where user spends 90% of time
 * Shows today's collections, summary cards, and quick actions
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  useColorScheme,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/Colors';
import {
  getDatabase,
  getPeopleWithTodayStatus,
  getDashboardSummary,
  recordCollection,
  skipCollection,
  undoCollection,
  getActiveCycle,
} from '@/services/database';
import { exportAndShareStatusReport } from '@/services/export';
import { PersonWithStatus, CollectionStatus } from '@/types';
import SummaryCard from '@/components/ui/SummaryCard';
import PersonCard from '@/components/collection/PersonCard';
import Button from '@/components/ui/Button';
import NumberPad from '@/components/ui/NumberPad';
import CollectionSuccessModal from '@/components/collection/CollectionSuccessModal';

interface DashboardSummary {
  todayCollected: number;
  todayCount: number;
  pendingCount: number;
  pendingEstimate: number;
  monthTotal: number;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [refreshing, setRefreshing] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    todayCollected: 0,
    todayCount: 0,
    pendingCount: 0,
    pendingEstimate: 0,
    monthTotal: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState('');

  // Collection success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    personName: string;
    personPhone?: string;
    amount: number;
    cycleTotal: number;
    date: string;
  } | null>(null);

  // Get greeting
  const getGreeting = () => {
    return '🙏 Jai SiyaRam';
  };

  // Format today's date
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return new Date().toLocaleDateString('en-IN', options);
  };

  // Load data
  const loadData = useCallback(async () => {
    try {
      await getDatabase();
      const [peopleData, summaryData] = await Promise.all([
        getPeopleWithTodayStatus(),
        getDashboardSummary(),
      ]);
      setPeople(peopleData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Handle collection
  const handleCollect = async (personId: number, amount: number, person?: any) => {
    try {
      await recordCollection(personId, amount);

      // Get updated cycle total for success modal
      const cycle = await getActiveCycle(personId);
      const cycleTotal = cycle?.totalAmount || amount;

      // Find person info if not passed
      const personInfo = person || people.find(p => p.id === personId);

      // Show success modal FIRST (before loadData to avoid freeze)
      setSuccessData({
        personName: personInfo?.name || 'Unknown',
        personPhone: personInfo?.phone,
        amount,
        cycleTotal,
        date: new Date().toISOString().split('T')[0],
      });
      setShowSuccessModal(true);

      // Load data in background (don't await to prevent freeze)
      loadData().catch(err => console.error('Error refreshing:', err));
    } catch (error) {
      console.error('Error recording collection:', error);
      Alert.alert('Error', 'Failed to record collection');
    }
  };

  // Handle custom amount
  const handleCustom = (person: any) => {
    setSelectedPerson(person);
    setCustomAmount(person.defaultAmount.toString());
    setShowNumberPad(true);
  };

  // Confirm custom amount
  const handleConfirmCustom = async () => {
    if (selectedPerson && customAmount) {
      const person = selectedPerson;
      const amount = parseInt(customAmount);

      // Clear state FIRST to close number pad immediately
      setShowNumberPad(false);
      setSelectedPerson(null);
      setCustomAmount('');

      try {
        await handleCollect(person.id, amount, person);
      } catch (error) {
        console.error('Error confirming custom amount:', error);
        Alert.alert('Error', 'Failed to record collection');
      }
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await exportAndShareStatusReport();
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not export report. Please try again.');
    }
  };

  // Handle skip
  const handleSkip = async (personId: number) => {
    Alert.alert(
      'Skip Collection',
      'Mark as skipped for today?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            try {
              await skipCollection(personId);
              await loadData();
            } catch (error) {
              console.error('Error skipping:', error);
            }
          }
        },
      ]
    );
  };

  // Handle undo
  const handleUndo = async (personId: number) => {
    try {
      await undoCollection(personId);
      await loadData();
    } catch (error) {
      console.error('Error undoing:', error);
    }
  };

  // Filter people by search
  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format currency
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate()}
            </Text>
          </View>
          <Button
            title=""
            onPress={() => router.push('/settings')}
            variant="ghost"
            size="small"
            icon={<MaterialCommunityIcons name="cog" size={24} color={colors.textSecondary} />}
          />
        </View>

        {/* Summary Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryContainer}
        >
          <SummaryCard
            title="Today's"
            value={formatCurrency(summary.todayCollected)}
            subtitle={`${summary.todayCount} collected`}
          />
          <SummaryCard
            title="Pending"
            value={`${summary.pendingCount} people`}
            subtitle={`${formatCurrency(summary.pendingEstimate)} est.`}
          />
          <SummaryCard
            title="This Month"
            value={formatCurrency(summary.monthTotal)}
            trend="up"
            trendValue="vs last"
          />
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Reports"
            onPress={() => router.push('/reports')}
            variant="secondary"
            size="small"
            icon={<MaterialCommunityIcons name="chart-bar" size={18} color={colors.accent} />}
          />
          <Button
            title="Add Person"
            onPress={() => router.push('/person/add')}
            variant="primary"
            size="small"
            icon={<MaterialCommunityIcons name="account-plus" size={18} color={colors.buttonPrimaryText} />}
          />
          <Button
            title="Export"
            onPress={handleExport}
            variant="secondary"
            size="small"
            icon={<MaterialCommunityIcons name="export" size={18} color={colors.accent} />}
          />
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search people..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Collection List */}
        <View style={styles.listContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Today's Collections
          </Text>

          {filteredPeople.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-off" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {searchQuery ? 'No matching people' : 'No people added yet'}
              </Text>
              <Button
                title="Add First Person"
                onPress={() => router.push('/person/add')}
                variant="primary"
                size="medium"
              />
            </View>
          ) : (
            filteredPeople.map((person) => (
              <PersonCard
                key={person.id}
                id={person.id}
                name={person.name}
                defaultAmount={person.defaultAmount}
                cycleTotal={person.cycleTotal || 0}
                status={person.todayStatus as CollectionStatus}
                todayAmount={person.todayAmount}
                onCollect={(amount) => handleCollect(person.id, amount, person)}
                onCustom={() => handleCustom(person)}
                onSkip={() => handleSkip(person.id)}
                onUndo={() => handleUndo(person.id)}
                onPress={() => router.push(`/person/${person.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Custom Amount Modal */}
      <Modal
        visible={showNumberPad}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNumberPad(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <NumberPad
              value={customAmount}
              onValueChange={setCustomAmount}
              onConfirm={handleConfirmCustom}
              onCancel={() => {
                setShowNumberPad(false);
                setSelectedPerson(null);
                setCustomAmount('');
              }}
              personName={selectedPerson?.name}
            />
          </View>
        </View>
      </Modal>

      {/* Collection Success Modal */}
      {successData && (
        <CollectionSuccessModal
          visible={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessData(null);
          }}
          personName={successData.personName}
          personPhone={successData.personPhone}
          amount={successData.amount}
          cycleTotal={successData.cycleTotal}
          date={successData.date}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  date: {
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  summaryContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSize.md,
    height: 40,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
});
