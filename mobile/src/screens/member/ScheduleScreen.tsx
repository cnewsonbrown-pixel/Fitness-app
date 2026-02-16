import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Card, Button } from '../../components/common';
import { memberService } from '../../services/member.service';
import { ClassSession, RootStackParamList } from '../../types';

type ScheduleScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation }) => {
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
      const data = await memberService.getSchedule({ startDate, endDate });
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

  const renderDaySelector = () => (
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
          const isToday = isSameDay(day, new Date());

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
              {isToday && <View style={styles.todayDot} />}
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
  );

  const renderClassItem = ({ item }: { item: ClassSession }) => {
    const spotsLeft = item.capacity - item.bookedCount;
    const isFull = spotsLeft <= 0;

    return (
      <Card
        variant="elevated"
        style={styles.classCard}
        onPress={() => navigation.navigate('ClassDetails', { classId: item.id })}
      >
        <View style={styles.classTime}>
          <Text style={styles.classTimeText}>
            {format(new Date(item.startTime), 'h:mm a')}
          </Text>
          <Text style={styles.classDuration}>
            {item.classType.duration} min
          </Text>
        </View>

        <View style={styles.classContent}>
          <View
            style={[styles.classColorBar, { backgroundColor: item.classType.color }]}
          />
          <View style={styles.classInfo}>
            <Text style={styles.className}>{item.classType.name}</Text>
            <Text style={styles.classInstructor}>
              {item.instructor.firstName} {item.instructor.lastName}
            </Text>
            <View style={styles.classDetails}>
              <View style={styles.classDetail}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={styles.classDetailText}>{item.location.name}</Text>
              </View>
              <View style={styles.classDetail}>
                <Ionicons name="people-outline" size={14} color="#64748b" />
                <Text
                  style={[styles.classDetailText, isFull && styles.fullText]}
                >
                  {isFull ? 'Full' : `${spotsLeft} spots left`}
                </Text>
              </View>
            </View>
          </View>

          <Button
            title={isFull ? 'Waitlist' : 'Book'}
            variant={isFull ? 'outline' : 'primary'}
            size="small"
            onPress={() => navigation.navigate('ClassDetails', { classId: item.id })}
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.monthYear}>
          {format(selectedDate, 'MMMM yyyy')}
        </Text>
      </View>

      {renderDaySelector()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>No classes scheduled</Text>
          <Text style={styles.emptySubtext}>
            Check back later or try a different date
          </Text>
        </View>
      ) : (
        <FlatList
          data={classes}
          renderItem={renderClassItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  monthYear: {
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  classCard: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  classTime: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    minWidth: 70,
  },
  classTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  classDuration: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  classContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  classColorBar: {
    width: 4,
    height: '100%',
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
  },
  classInstructor: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  classDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  classDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classDetailText: {
    fontSize: 12,
    color: '#64748b',
  },
  fullText: {
    color: '#ef4444',
  },
});
