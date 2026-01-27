/**
 * Manage Comments Screen (FR-15)
 * Admin screen for comment moderation
 * View, delete, or hide inappropriate comments on blogs or products
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';

const ManageCommentsScreen = ({ navigation }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, flagged, hidden, visible
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComment, setSelectedComment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [contentType, setContentType] = useState('all'); // all, blogs, products

  useEffect(() => {
    fetchComments();
  }, [filter, contentType]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Fetch comments from blogs
      const blogCommentsPromise = contentType !== 'products'
        ? fetchBlogComments()
        : Promise.resolve([]);

      // Fetch comments from products
      const productCommentsPromise = contentType !== 'blogs'
        ? fetchProductComments()
        : Promise.resolve([]);

      const [blogComments, productComments] = await Promise.all([
        blogCommentsPromise,
        productCommentsPromise,
      ]);

      let allComments = [...blogComments, ...productComments];

      // Apply filters
      if (filter === 'flagged') {
        allComments = allComments.filter(c => c.flagged);
      } else if (filter === 'hidden') {
        allComments = allComments.filter(c => c.hidden);
      } else if (filter === 'visible') {
        allComments = allComments.filter(c => !c.hidden);
      }

      // Sort by date (newest first)
      allComments.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });

      setComments(allComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBlogComments = async () => {
    const commentsArray = [];
    try {
      const blogsSnapshot = await getDocs(collection(db, 'blogs'));

      for (const blogDoc of blogsSnapshot.docs) {
        const blogData = blogDoc.data();
        const commentsRef = collection(db, 'blogs', blogDoc.id, 'comments');
        const commentsSnapshot = await getDocs(commentsRef);

        commentsSnapshot.docs.forEach(commentDoc => {
          commentsArray.push({
            id: commentDoc.id,
            parentId: blogDoc.id,
            parentType: 'blog',
            parentTitle: blogData.title || 'Untitled Blog',
            ...commentDoc.data(),
          });
        });
      }
    } catch (error) {
      console.error('Error fetching blog comments:', error);
    }
    return commentsArray;
  };

  const fetchProductComments = async () => {
    const commentsArray = [];
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));

      for (const productDoc of productsSnapshot.docs) {
        const productData = productDoc.data();
        const commentsRef = collection(db, 'products', productDoc.id, 'comments');
        const commentsSnapshot = await getDocs(commentsRef);

        commentsSnapshot.docs.forEach(commentDoc => {
          commentsArray.push({
            id: commentDoc.id,
            parentId: productDoc.id,
            parentType: 'product',
            parentTitle: productData.name || 'Untitled Product',
            ...commentDoc.data(),
          });
        });
      }
    } catch (error) {
      console.error('Error fetching product comments:', error);
    }
    return commentsArray;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComments();
  };

  const handleToggleHide = async (comment) => {
    try {
      const collectionName = comment.parentType === 'blog' ? 'blogs' : 'products';
      const commentRef = doc(db, collectionName, comment.parentId, 'comments', comment.id);

      await updateDoc(commentRef, {
        hidden: !comment.hidden,
        hiddenAt: comment.hidden ? null : serverTimestamp(),
        hiddenBy: comment.hidden ? null : 'admin',
      });

      // Update local state
      setComments(prev =>
        prev.map(c =>
          c.id === comment.id && c.parentId === comment.parentId
            ? { ...c, hidden: !c.hidden }
            : c
        )
      );

      Alert.alert(
        'Success',
        comment.hidden ? 'Comment is now visible' : 'Comment has been hidden'
      );
    } catch (error) {
      console.error('Error toggling comment visibility:', error);
      Alert.alert('Error', 'Failed to update comment');
    }
  };

  const handleDelete = (comment) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to permanently delete this comment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const collectionName = comment.parentType === 'blog' ? 'blogs' : 'products';
              const commentRef = doc(db, collectionName, comment.parentId, 'comments', comment.id);

              await deleteDoc(commentRef);

              // Update local state
              setComments(prev =>
                prev.filter(c => !(c.id === comment.id && c.parentId === comment.parentId))
              );

              Alert.alert('Success', 'Comment deleted successfully');
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handleFlag = async (comment) => {
    try {
      const collectionName = comment.parentType === 'blog' ? 'blogs' : 'products';
      const commentRef = doc(db, collectionName, comment.parentId, 'comments', comment.id);

      await updateDoc(commentRef, {
        flagged: !comment.flagged,
        flaggedAt: comment.flagged ? null : serverTimestamp(),
        flaggedBy: comment.flagged ? null : 'admin',
      });

      // Update local state
      setComments(prev =>
        prev.map(c =>
          c.id === comment.id && c.parentId === comment.parentId
            ? { ...c, flagged: !c.flagged }
            : c
        )
      );

      Alert.alert(
        'Success',
        comment.flagged ? 'Flag removed' : 'Comment flagged for review'
      );
    } catch (error) {
      console.error('Error flagging comment:', error);
      Alert.alert('Error', 'Failed to flag comment');
    }
  };

  const handleViewDetail = (comment) => {
    setSelectedComment(comment);
    setShowDetailModal(true);
  };

  const filteredComments = comments.filter(comment => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      comment.text?.toLowerCase().includes(query) ||
      comment.userName?.toLowerCase().includes(query) ||
      comment.parentTitle?.toLowerCase().includes(query)
    );
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderFilterButton = (filterValue, label, icon) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterValue)}
    >
      <Ionicons
        name={icon}
        size={16}
        color={filter === filterValue ? '#FFFFFF' : '#666'}
      />
      <Text
        style={[
          styles.filterButtonText,
          filter === filterValue && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderContentTypeButton = (type, label) => (
    <TouchableOpacity
      style={[
        styles.contentTypeButton,
        contentType === type && styles.contentTypeButtonActive,
      ]}
      onPress={() => setContentType(type)}
    >
      <Text
        style={[
          styles.contentTypeText,
          contentType === type && styles.contentTypeTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCommentItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.commentCard,
        item.hidden && styles.commentCardHidden,
        item.flagged && styles.commentCardFlagged,
      ]}
      onPress={() => handleViewDetail(item)}
    >
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          {item.userAvatar ? (
            <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color="#999" />
            </View>
          )}
          <View>
            <Text style={styles.userName}>{item.userName || 'Anonymous'}</Text>
            <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.badges}>
          {item.hidden && (
            <View style={[styles.badge, styles.badgeHidden]}>
              <Ionicons name="eye-off" size={12} color="#FFF" />
              <Text style={styles.badgeText}>Hidden</Text>
            </View>
          )}
          {item.flagged && (
            <View style={[styles.badge, styles.badgeFlagged]}>
              <Ionicons name="flag" size={12} color="#FFF" />
              <Text style={styles.badgeText}>Flagged</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.parentInfo}>
        <Ionicons
          name={item.parentType === 'blog' ? 'document-text' : 'cube'}
          size={14}
          color="#666"
        />
        <Text style={styles.parentTitle} numberOfLines={1}>
          {item.parentTitle}
        </Text>
      </View>

      <Text style={styles.commentText} numberOfLines={3}>
        {item.text}
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleViewDetail(item)}
        >
          <Ionicons name="eye" size={16} color="#2196F3" />
          <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.hideButton]}
          onPress={() => handleToggleHide(item)}
        >
          <Ionicons
            name={item.hidden ? 'eye' : 'eye-off'}
            size={16}
            color="#FF9800"
          />
          <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>
            {item.hidden ? 'Show' : 'Hide'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.flagButton]}
          onPress={() => handleFlag(item)}
        >
          <Ionicons
            name={item.flagged ? 'flag' : 'flag-outline'}
            size={16}
            color="#9C27B0"
          />
          <Text style={[styles.actionButtonText, { color: '#9C27B0' }]}>
            {item.flagged ? 'Unflag' : 'Flag'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={16} color="#F44336" />
          <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Comments</Text>
          <View style={styles.headerRight}>
            <Text style={styles.commentCount}>{filteredComments.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search comments..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Content Type Filter */}
      <View style={styles.contentTypeContainer}>
        {renderContentTypeButton('all', 'All')}
        {renderContentTypeButton('blogs', 'Blogs')}
        {renderContentTypeButton('products', 'Products')}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', 'list')}
        {renderFilterButton('flagged', 'Flagged', 'flag')}
        {renderFilterButton('hidden', 'Hidden', 'eye-off')}
        {renderFilterButton('visible', 'Visible', 'eye')}
      </View>

      {/* Comments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      ) : filteredComments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No comments found</Text>
          <Text style={styles.emptySubtext}>
            {filter !== 'all'
              ? 'Try changing the filter'
              : 'Comments will appear here when users post them'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredComments}
          renderItem={renderCommentItem}
          keyExtractor={(item) => `${item.parentType}-${item.parentId}-${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
            />
          }
        />
      )}

      {/* Comment Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comment Details</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedComment && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User:</Text>
                  <Text style={styles.detailValue}>
                    {selectedComment.userName || 'Anonymous'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Posted on:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedComment.createdAt)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {selectedComment.parentType === 'blog' ? 'Blog:' : 'Product:'}
                  </Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {selectedComment.parentTitle}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={styles.statusBadges}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: selectedComment.hidden ? '#FF9800' : '#4CAF50' },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {selectedComment.hidden ? 'Hidden' : 'Visible'}
                      </Text>
                    </View>
                    {selectedComment.flagged && (
                      <View style={[styles.statusBadge, { backgroundColor: '#F44336' }]}>
                        <Text style={styles.statusBadgeText}>Flagged</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.commentFullText}>
                  <Text style={styles.detailLabel}>Comment:</Text>
                  <Text style={styles.fullCommentText}>{selectedComment.text}</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#FF9800' }]}
                    onPress={() => {
                      handleToggleHide(selectedComment);
                      setShowDetailModal(false);
                    }}
                  >
                    <Ionicons
                      name={selectedComment.hidden ? 'eye' : 'eye-off'}
                      size={18}
                      color="#FFF"
                    />
                    <Text style={styles.modalButtonText}>
                      {selectedComment.hidden ? 'Show' : 'Hide'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                    onPress={() => {
                      setShowDetailModal(false);
                      handleDelete(selectedComment);
                    }}
                  >
                    <Ionicons name="trash" size={18} color="#FFF" />
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
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
  headerRight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  commentCount: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  contentTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  contentTypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  contentTypeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  contentTypeText: {
    fontSize: 14,
    color: '#666',
  },
  contentTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
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
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  commentCardHidden: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  commentCardFlagged: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  badges: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeHidden: {
    backgroundColor: '#FF9800',
  },
  badgeFlagged: {
    backgroundColor: '#F44336',
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 2,
  },
  parentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  parentTitle: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
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
    color: '#333',
  },
  modalBody: {
    paddingBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  statusBadges: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  commentFullText: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  fullCommentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ManageCommentsScreen;
