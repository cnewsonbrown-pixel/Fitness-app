import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button } from '../../components/common';
import { instructorService } from '../../services/instructor.service';
import { RootStackParamList } from '../../types';

type SubstituteRequestsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

interface SubstituteRequest {
  id: string;
  classSession: {
    id: string;
    className: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  requestedBy: {
    id: string;
    name: string;
  };
  reason?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
}

interface MySubRequest {
  id: string;
  classSession: {
    id: string;
    className: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  reason?: string;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  acceptedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export const SubstituteRequestsScreen: React.FC<SubstituteRequestsScreenProps> = ({
  navigation,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'my_requests'>('available');
  const [availableRequests, setAvailableRequests] = useState<SubstituteRequest[]>([]);
  const [myRequests, setMyRequests] = useState<MySubRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'available') {
        const data = await instructorService.getAvailableSubRequests();
        setAvailableRequests(data);
      } else {
        const data = await instructorService.getMySubRequests();
        setMyRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch substitute requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUpcomingClasses = async () => {
    try {
      const data = await instructorService.getUpcomingClasses();
      setUpcomingClasses(data.filter((c: any) => !c.hasSubRequest));
    } catch (error) {
      console.error('Failed to fetch upcoming classes:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [activeTab]);

  const handleAcceptRequest = async (requestId: string) => {
    Alert.alert(
      'Accept Request',
      'Are you sure you want to accept this substitute request? You will be assigned to teach this class.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await instructorService.acceptSubRequest(requestId);
              fetchData();
              Alert.alert('Success', 'You have been assigned to this class.');
            } catch (error) {
              Alert.alert('Error', 'Failed to accept request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await instructorService.declineSubRequest(requestId);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline request.');
    }
  };

  const handleCancelMyRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this substitute request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await instructorService.cancelSubRequest(requestId);
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel request.');
            }
          },
        },
      ]
    );
  };

  const handleCreateRequest = async () => {
    if (!selectedClassId) {
      Alert.alert('Error', 'Please select a class');
      return;
    }

    try {
      await instructorService.createSubRequest(selectedClassId, reason);
      setShowCreateModal(false);
      setSelectedClassId(null);
      setReason('');
      fetchData();
      Alert.alert('Success', 'Substitute request created successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to create request. Please try again.');
    }
  };

  const openCreateModal = async () => {
    await fetchUpcomingClasses();
    setShowCreateModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b';
      case 'ACCEPTED':
      case 'FILLED':
        return '#10b981';
      case 'DECLINED':
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const renderAvailableRequest = ({ item }: { item: SubstituteRequest }) => (
    <Card variant="elevated" style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.classInfo}>
          <Text style={styles.className}>{item.classSession.className}</Text>
          <Text style={styles.requestedBy}>Requested by {item.requestedBy.name}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {format(new Date(item.classSession.startTime), 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {format(new Date(item.classSession.startTime), 'h:mm a')} -{' '}
            {format(new Date(item.classSession.endTime), 'h:mm a')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>{item.classSession.location}</Text>
        </View>
      </View>

      {item.reason && (
        <View style={styles.reasonSection}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      )}

      {item.status === 'PENDING' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDeclineRequest(item.id)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  const renderMyRequest = ({ item }: { item: MySubRequest }) => (
    <Card variant="elevated" style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.classInfo}>
          <Text style={styles.className}>{item.classSession.className}</Text>
          {item.acceptedBy && (
            <Text style={styles.acceptedBy}>
              Covered by {item.acceptedBy.name}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {format(new Date(item.classSession.startTime), 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {format(new Date(item.classSession.startTime), 'h:mm a')} -{' '}
            {format(new Date(item.classSession.endTime), 'h:mm a')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>{item.classSession.location}</Text>
        </View>
      </View>

      {item.reason && (
        <View style={styles.reasonSection}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
      )}

      {item.status === 'PENDING' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelMyRequest(item.id)}
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Substitute</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Select Class</Text>
          <View style={styles.classSelector}>
            {upcomingClasses.length === 0 ? (
              <Text style={styles.noClassesText}>
                No upcoming classes available for substitute requests
              </Text>
            ) : (
              upcomingClasses.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classOption,
                    selectedClassId === cls.id && styles.classOptionSelected,
                  ]}
                  onPress={() => setSelectedClassId(cls.id)}
                >
                  <View style={styles.classOptionContent}>
                    <Text style={styles.classOptionName}>{cls.className}</Text>
                    <Text style={styles.classOptionTime}>
                      {format(new Date(cls.startTime), 'MMM d, h:mm a')}
                    </Text>
                  </View>
                  {selectedClassId === cls.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          <Text style={styles.inputLabel}>Reason (Optional)</Text>
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="Enter reason for needing a substitute"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSubmitButton,
                !selectedClassId && styles.modalSubmitButtonDisabled,
              ]}
              onPress={handleCreateRequest}
              disabled={!selectedClassId}
            >
              <Text style={styles.modalSubmitText}>Submit Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Substitute Requests</Text>
        <TouchableOpacity onPress={openCreateModal}>
          <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'available' && styles.tabTextActive,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my_requests' && styles.tabActive]}
          onPress={() => setActiveTab('my_requests')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'my_requests' && styles.tabTextActive,
            ]}
          >
            My Requests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={activeTab === 'available' ? availableRequests : myRequests}
        renderItem={activeTab === 'available' ? renderAvailableRequest : renderMyRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="swap-horizontal-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {activeTab === 'available'
                  ? 'No substitute requests available'
                  : 'You have no substitute requests'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'available'
                  ? 'Check back later for new requests'
                  : 'Tap the + button to request a substitute'}
              </Text>
            </View>
          ) : null
        }
      />

      {renderCreateModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#6366f1',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  requestCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  requestedBy: {
    fontSize: 12,
    color: '#64748b',
  },
  acceptedBy: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sessionDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
  },
  reasonSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#1e293b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  classSelector: {
    marginBottom: 20,
    maxHeight: 200,
  },
  noClassesText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    padding: 20,
  },
  classOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  classOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#ede9fe',
  },
  classOptionContent: {
    flex: 1,
  },
  classOptionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  classOptionTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
