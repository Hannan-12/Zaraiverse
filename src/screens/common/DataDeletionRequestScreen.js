/**
 * Data Deletion Request Screen (SEC-5)
 * UI for users to request full data deletion
 * Must be honored within 7 days per security requirements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import {
  submitDeletionRequest,
  cancelDeletionRequest,
  getUserDeletionRequests,
  DeletionRequestStatus,
} from '../../services/dataDeletionService';

const DataDeletionRequestScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    fetchExistingRequests();
  }, []);

  const fetchExistingRequests = async () => {
    try {
      const requests = await getUserDeletionRequests(user.uid);
      setExistingRequests(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!acknowledged) {
      Alert.alert(
        'Acknowledgment Required',
        'Please acknowledge that you understand this action is irreversible.'
      );
      return;
    }

    Alert.alert(
      'Confirm Data Deletion',
      'Are you absolutely sure you want to request deletion of all your data? This action cannot be undone once processed.\n\nYour account and all associated data will be permanently deleted within 7 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete My Data',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await submitDeletionRequest(user.uid, reason);
              Alert.alert(
                'Request Submitted',
                `Your data deletion request has been submitted successfully.\n\nRequest ID: ${result.requestId}\nDeadline: ${result.deadline.toLocaleDateString()}\n\nYou will receive a confirmation email shortly.`,
                [{ text: 'OK', onPress: () => fetchExistingRequests() }]
              );
              setReason('');
              setAcknowledged(false);
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async (requestId) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this deletion request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            try {
              await cancelDeletionRequest(requestId, user.uid);
              Alert.alert('Success', 'Deletion request has been cancelled.');
              fetchExistingRequests();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case DeletionRequestStatus.PENDING:
        return '#FF9800';
      case DeletionRequestStatus.IN_PROGRESS:
        return '#2196F3';
      case DeletionRequestStatus.COMPLETED:
        return '#4CAF50';
      case DeletionRequestStatus.CANCELLED:
        return '#9E9E9E';
      case DeletionRequestStatus.FAILED:
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case DeletionRequestStatus.PENDING:
        return 'time-outline';
      case DeletionRequestStatus.IN_PROGRESS:
        return 'sync';
      case DeletionRequestStatus.COMPLETED:
        return 'checkmark-circle';
      case DeletionRequestStatus.CANCELLED:
        return 'close-circle';
      case DeletionRequestStatus.FAILED:
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasPendingRequest = existingRequests.some(
    r => r.status === DeletionRequestStatus.PENDING ||
         r.status === DeletionRequestStatus.IN_PROGRESS
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F44336', '#C62828']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete My Data</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Section */}
        <View style={styles.warningSection}>
          <Ionicons name="warning" size={48} color="#F44336" />
          <Text style={styles.warningTitle}>Data Deletion Request</Text>
          <Text style={styles.warningText}>
            Requesting data deletion will permanently remove your account and all
            associated data from ZaraiVerse. This action is irreversible once
            processed.
          </Text>
        </View>

        {/* What Will Be Deleted */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Will Be Deleted</Text>
          <View style={styles.deleteList}>
            {[
              'Your user profile and account',
              'Order history and transactions',
              'Crop data and farming records',
              'Products (if you are a seller)',
              'Chat history and messages',
              'Uploaded images and files',
              'All personal information',
            ].map((item, index) => (
              <View key={index} style={styles.deleteItem}>
                <Ionicons name="trash-outline" size={16} color="#F44336" />
                <Text style={styles.deleteItemText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Processing Timeline</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons name="document-text" size={20} color="#4CAF50" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Request Submitted</Text>
              <Text style={styles.timelineText}>
                You'll receive a confirmation email
              </Text>
            </View>
          </View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons name="timer" size={20} color="#FF9800" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Processing Period</Text>
              <Text style={styles.timelineText}>
                Your request will be processed within 7 days
              </Text>
            </View>
          </View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#2196F3" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Deletion Complete</Text>
              <Text style={styles.timelineText}>
                You'll receive a final confirmation email
              </Text>
            </View>
          </View>
        </View>

        {/* Existing Requests */}
        {loadingRequests ? (
          <ActivityIndicator size="small" color="#4CAF50" style={styles.loader} />
        ) : existingRequests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Requests</Text>
            {existingRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Ionicons
                    name={getStatusIcon(request.status)}
                    size={24}
                    color={getStatusColor(request.status)}
                  />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestId}>#{request.id.slice(0, 8)}</Text>
                    <Text style={[styles.requestStatus, { color: getStatusColor(request.status) }]}>
                      {request.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestDetails}>
                  <Text style={styles.requestDate}>
                    Submitted: {formatDate(request.createdAt)}
                  </Text>
                  <Text style={styles.requestDate}>
                    Deadline: {formatDate(request.deadline)}
                  </Text>
                </View>
                {request.status === DeletionRequestStatus.PENDING && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelRequest(request.id)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : null}

        {/* New Request Form */}
        {!hasPendingRequest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit New Request</Text>

            <Text style={styles.inputLabel}>Reason (Optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us why you're leaving..."
              placeholderTextColor="#999"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Acknowledgment Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcknowledged(!acknowledged)}
            >
              <View style={[styles.checkbox, acknowledged && styles.checkboxChecked]}>
                {acknowledged && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand that this action is irreversible and all my data will
                be permanently deleted within 7 days.
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!acknowledged || loading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitRequest}
              disabled={!acknowledged || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>
                    Request Data Deletion
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <Text style={styles.supportText}>
            Have questions or need help?
          </Text>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => navigation.navigate('HelpCenter')}
          >
            <Ionicons name="help-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningSection: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C62828',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  deleteList: {
    gap: 12,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timelineText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 19,
    marginVertical: 4,
  },
  loader: {
    marginVertical: 20,
  },
  requestCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    marginLeft: 12,
  },
  requestId: {
    fontSize: 12,
    color: '#999',
  },
  requestStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestDetails: {
    marginBottom: 12,
  },
  requestDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F44336',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  supportSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  supportButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DataDeletionRequestScreen;
