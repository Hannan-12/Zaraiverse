/**
 * Error Logs Screen (REL-3)
 * Admin dashboard for viewing and managing system errors
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import {
  getRecentErrors,
  getErrorStats,
  resolveError,
  ErrorSeverity,
  ErrorCategory,
} from '../../services/errorLoggingService';

const ErrorLogsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedError, setSelectedError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const [errorsData, statsData] = await Promise.all([
        getRecentErrors({
          severity: filter === 'all' ? null : filter,
          resolved: filter === 'unresolved' ? false : null,
        }),
        getErrorStats(),
      ]);
      setErrors(errorsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load error logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleResolve = async (errorId, resolution = '') => {
    setResolving(true);
    try {
      await resolveError(errorId, user.uid, resolution);
      Alert.alert('Success', 'Error marked as resolved');
      fetchData();
      setShowDetailModal(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setResolving(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '#D32F2F';
      case ErrorSeverity.HIGH:
        return '#F57C00';
      case ErrorSeverity.MEDIUM:
        return '#FBC02D';
      case ErrorSeverity.LOW:
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'alert-circle';
      case ErrorSeverity.HIGH:
        return 'warning';
      case ErrorSeverity.MEDIUM:
        return 'information-circle';
      case ErrorSeverity.LOW:
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case ErrorCategory.NETWORK:
        return 'wifi';
      case ErrorCategory.AUTHENTICATION:
        return 'lock-closed';
      case ErrorCategory.DATABASE:
        return 'server';
      case ErrorCategory.PAYMENT:
        return 'card';
      case ErrorCategory.UI:
        return 'phone-portrait';
      case ErrorCategory.API:
        return 'cloud';
      default:
        return 'bug';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const renderFilterButton = (filterValue, label, count) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterValue)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterValue && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[
          styles.filterBadge,
          filter === filterValue && styles.filterBadgeActive
        ]}>
          <Text style={[
            styles.filterBadgeText,
            filter === filterValue && styles.filterBadgeTextActive
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderErrorItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.errorCard,
        item.resolved && styles.errorCardResolved,
      ]}
      onPress={() => {
        setSelectedError(item);
        setShowDetailModal(true);
      }}
    >
      <View style={styles.errorHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Ionicons
            name={getSeverityIcon(item.severity)}
            size={14}
            color="#FFFFFF"
          />
          <Text style={styles.severityText}>{item.severity?.toUpperCase()}</Text>
        </View>
        {item.resolved && (
          <View style={styles.resolvedBadge}>
            <Ionicons name="checkmark" size={12} color="#4CAF50" />
            <Text style={styles.resolvedText}>Resolved</Text>
          </View>
        )}
      </View>

      <Text style={styles.errorMessage} numberOfLines={2}>
        {item.message}
      </Text>

      <View style={styles.errorMeta}>
        <View style={styles.metaItem}>
          <Ionicons name={getCategoryIcon(item.category)} size={14} color="#666" />
          <Text style={styles.metaText}>{item.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.metaText}>{formatTimestamp(item.createdAt)}</Text>
        </View>
      </View>

      {item.screenName && (
        <View style={styles.screenInfo}>
          <Ionicons name="phone-portrait-outline" size={12} color="#999" />
          <Text style={styles.screenText}>{item.screenName}</Text>
        </View>
      )}
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Error Logs</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Section */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.last24Hours}</Text>
            <Text style={styles.statLabel}>24 Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F44336' }]}>
              {stats.unresolved}
            </Text>
            <Text style={styles.statLabel}>Unresolved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#D32F2F' }]}>
              {stats.bySeverity?.critical || 0}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', stats?.total)}
        {renderFilterButton('unresolved', 'Unresolved', stats?.unresolved)}
        {renderFilterButton(ErrorSeverity.CRITICAL, 'Critical', stats?.bySeverity?.critical)}
        {renderFilterButton(ErrorSeverity.HIGH, 'High', stats?.bySeverity?.high)}
      </View>

      {/* Errors List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F44336" />
          <Text style={styles.loadingText}>Loading error logs...</Text>
        </View>
      ) : errors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
          <Text style={styles.emptyText}>No errors found</Text>
          <Text style={styles.emptySubtext}>
            {filter !== 'all' ? 'Try changing the filter' : 'System is running smoothly'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={errors}
          renderItem={renderErrorItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#F44336']}
            />
          }
        />
      )}

      {/* Error Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Error Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedError && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Severity:</Text>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedError.severity) }]}>
                    <Text style={styles.severityText}>
                      {selectedError.severity?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{selectedError.category}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {formatTimestamp(selectedError.createdAt)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Screen:</Text>
                  <Text style={styles.detailValue}>
                    {selectedError.screenName || 'Unknown'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedError.resolved ? '#4CAF50' : '#F44336' }
                  ]}>
                    {selectedError.resolved ? 'Resolved' : 'Unresolved'}
                  </Text>
                </View>

                <View style={styles.messageContainer}>
                  <Text style={styles.detailLabel}>Message:</Text>
                  <Text style={styles.errorMessageFull}>{selectedError.message}</Text>
                </View>

                {selectedError.stack && (
                  <View style={styles.stackContainer}>
                    <Text style={styles.detailLabel}>Stack Trace:</Text>
                    <Text style={styles.stackTrace} numberOfLines={10}>
                      {selectedError.stack}
                    </Text>
                  </View>
                )}

                {!selectedError.resolved && (
                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => handleResolve(selectedError.id)}
                    disabled={resolving}
                  >
                    {resolving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#F44336',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#BDBDBD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorCardResolved: {
    borderLeftColor: '#4CAF50',
    opacity: 0.8,
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  resolvedText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  errorMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  screenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  screenText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
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
    color: '#333',
  },
  modalBody: {
    paddingBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  messageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  errorMessageFull: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 8,
  },
  stackContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  stackTrace: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  resolveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ErrorLogsScreen;
