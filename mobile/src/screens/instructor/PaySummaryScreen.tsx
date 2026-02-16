import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Card } from '../../components/common';
import { instructorService, PaySummary } from '../../services/instructor.service';

export const PaySummaryScreen: React.FC = () => {
  const [paySummary, setPaySummary] = useState<PaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    fetchPaySummary();
  }, [selectedMonth]);

  const fetchPaySummary = async () => {
    setIsLoading(true);
    try {
      const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      const data = await instructorService.getPaySummary({ startDate, endDate });
      setPaySummary(data);
    } catch (error) {
      console.error('Failed to fetch pay summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth((current) =>
      direction === 'prev' ? subMonths(current, 1) : subMonths(current, -1)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={() => navigateMonth('prev')}
        >
          <Ionicons name="chevron-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(selectedMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={() => navigateMonth('next')}
          disabled={
            format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
          }
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={
              format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
                ? '#cbd5e1'
                : '#6366f1'
            }
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchPaySummary} />
        }
      >
        {/* Summary Card */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.totalEarnings}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(paySummary?.totalEarnings || 0)}
            </Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Ionicons name="calendar" size={24} color="#6366f1" />
              <Text style={styles.summaryStatValue}>{paySummary?.classCount || 0}</Text>
              <Text style={styles.summaryStatLabel}>Classes Taught</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Ionicons name="cash" size={24} color="#22c55e" />
              <Text style={styles.summaryStatValue}>
                {formatCurrency((paySummary?.totalEarnings || 0) / (paySummary?.classCount || 1))}
              </Text>
              <Text style={styles.summaryStatLabel}>Avg per Class</Text>
            </View>
          </View>
        </Card>

        {/* Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Breakdown</Text>
          {paySummary?.breakdown && paySummary.breakdown.length > 0 ? (
            paySummary.breakdown.map((item, index) => (
              <Card key={index} variant="default" style={styles.breakdownCard}>
                <View style={styles.breakdownHeader}>
                  <View>
                    <Text style={styles.breakdownDate}>
                      {format(new Date(item.date), 'EEE, MMM d')}
                    </Text>
                    <Text style={styles.breakdownClass}>{item.className}</Text>
                  </View>
                  <View style={styles.breakdownAmountContainer}>
                    <Text style={styles.breakdownAmount}>
                      {formatCurrency(item.rate)}
                    </Text>
                    <Text style={styles.breakdownAttendees}>
                      {item.attendeeCount} attendees
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No classes this month</Text>
            </View>
          )}
        </View>

        {/* Pay Schedule Info */}
        <Card variant="outlined" style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#6366f1" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Payment Schedule</Text>
            <Text style={styles.infoText}>
              Payments are processed on the 1st and 15th of each month. Direct deposit
              typically arrives within 2-3 business days.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  monthNavButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 24,
  },
  totalEarnings: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryStats: {
    flexDirection: 'row',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  breakdownCard: {
    marginBottom: 8,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownDate: {
    fontSize: 14,
    color: '#64748b',
  },
  breakdownClass: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 4,
  },
  breakdownAmountContainer: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22c55e',
  },
  breakdownAttendees: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
});
