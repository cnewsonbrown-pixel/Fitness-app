import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import { instructorService } from '../../services/instructor.service';
import { ClassSession, RootStackParamList } from '../../types';

type InstructorScheduleScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const InstructorScheduleScreen: React.FC<InstructorScheduleScreenProps> = ({
  navigation,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    fetchClasses();
  }, [selectedDate]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const startDate = format(selectedDate, 'yyyy-MM-dd');
      const endDate = format(selectedDate, 'yyyy-MM-dd');
      const data = await instructorService.getMySchedule({ startDate, endDate });
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = addDays(weekStart, direction === 'next' ? 7 : -7);
    setWeekStart(newWeekStart);
    setSelectedDate(newWeekStart);
  };

  const renderClassItem = ({ item }: { item: ClassSession }) => {
    const isPast = new Date(item.endTime) < new Date();
    const isInProgress =
      new Date(item.startTime) <= new Date() && new Date(item.endTime) > new Date();

    return (
      <Card
        variant="elevated"
        style={[styles.classCard, isPast && styles.pastClass]}
        onPress={() => navigation.navigate('ClassDetails', { classId: item.id })}
      >
        <View style={styles.classHeader}>
          <View style={styles.timeContainer}>
            <Text style={styles.classTime}>
              {format(new Date(item.startTime), 'h:mm a')}
            </Text>
            <Text style={styles.classDuration}>{item.classType.duration} min</Text>
          </View>
          {isInProgress && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.classContent}>
          <View
            style={[styles.classColorBar, { backgroundColor: item.classType.color }]}
          />
          <View style={styles.classInfo}>
            <Text style={styles.className}>{item.classType.name}</Text>
            <View style={styles.classDetails}>
              <View style={styles.classDetail}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.classDetailText}>{item.location.name}</Text>
              </View>
              <View style={styles.classDetail}>
                <Ionicons name="people" size={14} color="#64748b" />
                <Text style={styles.classDetailText}>
                  {item.bookedCount}/{item.capacity} booked
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.classActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ClassDetails', { classId: item.id })}
          >
            <Ionicons name="list-outline" size={20} color="#6366f1" />
            <Text style={styles.actionText}>Roster</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {}}
          >
            <Ionicons name="swap-horizontal-outline" size={20} color="#64748b" />
            <Text style={styles.actionTextSecondary}>Sub Request</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Schedule</Text>
        <Text style={styles.subtitle}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>

      {/* Week Selector */}
      <View style={styles.weekSelector}>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => navigateWeek('prev')}
        >
          <Ionicons name="chevron-back" size={24} color="#6366f1" />
        </TouchableOpacity>

        <View style={styles.daysContainer}>
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isToday(day);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                  {format(day, 'EEE')}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                  {format(day, 'd')}
                </Text>
                {isDayToday && !isSelected && <View style={styles.todayDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => navigateWeek('next')}
        >
          <Ionicons name="chevron-forward" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Classes List */}
      {classes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>No classes scheduled</Text>
          <Text style={styles.emptySubtext}>You don't have any classes on this day</Text>
        </View>
      ) : (
        <FlatList
          data={classes}
          renderItem={renderClassItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchClasses} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  weekNavButton: {
    padding: 8,
  },
  daysContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    minWidth: 44,
  },
  dayButtonSelected: {
    backgroundColor: '#6366f1',
  },
  dayName: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#fff',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  dayNumberSelected: {
    color: '#fff',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6366f1',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  classCard: {
    marginBottom: 16,
  },
  pastClass: {
    opacity: 0.6,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {},
  classTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  classDuration: {
    fontSize: 12,
    color: '#64748b',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  classContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  classColorBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  classDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  classDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classDetailText: {
    fontSize: 14,
    color: '#64748b',
  },
  classActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  actionTextSecondary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
});
