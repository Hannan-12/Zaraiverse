// src/screens/admin/ManageUsers.js
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // ---------------------------------------------------------
        // ✅ CRITICAL FIX: If status is missing, assume 'pending'
        // This ensures existing users show up for approval.
        // ---------------------------------------------------------
        const userStatus = data.status ? data.status : 'pending';

        usersList.push({ 
          id: doc.id, 
          ...data,
          status: userStatus 
        });
      });
      
      // Sort: Pending users first
      usersList.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApproveUser = (user) => {
    Alert.alert(
      "Approve User",
      `Allow ${user.name || 'this user'} to login?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Approve", 
          onPress: async () => {
            try {
              const userRef = doc(db, 'users', user.id);
              // Set status to 'active' so they can login
              await updateDoc(userRef, { status: 'active' }); 
            } catch (error) {
              Alert.alert("Error", "Could not approve user.");
            }
          }
        }
      ]
    );
  };

  const toggleUserStatus = async (user) => {
    // If they are active, block them. If blocked, make active.
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { status: newStatus });
    } catch (error) {
      Alert.alert("Error", "Could not update status.");
    }
  };

  const handleDeleteUser = (user) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDoc(doc(db, 'users', user.id)) }
    ]);
  };

  const renderUser = ({ item }) => {
    const isPending = item.status === 'pending';
    const isBlocked = item.status === 'blocked';

    return (
      <View style={[
        styles.userCard, 
        isPending && styles.pendingCard,
        isBlocked && styles.blockedCard
      ]}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.name || 'No Name'} 
            {isPending && <Text style={{color: '#E67E22'}}> (Needs Approval)</Text>}
            {isBlocked && <Text style={{color: '#C62828'}}> (Blocked)</Text>}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userRole}>{item.role}</Text>
        </View>

        <View style={styles.actions}>
          {isPending ? (
            // ✅ APPROVE BUTTON (Visible if status is 'pending' or undefined)
            <TouchableOpacity onPress={() => handleApproveUser(item)} style={styles.actionBtn}>
              <MaterialIcons name="check-circle" size={30} color="#4CAF50" />
            </TouchableOpacity>
          ) : (
            // BLOCK BUTTON (Visible if active or blocked)
            <TouchableOpacity onPress={() => toggleUserStatus(item)} style={styles.iconBtn}>
              <Ionicons 
                name={isBlocked ? "lock-closed" : "lock-open"} 
                size={22} 
                color={isBlocked ? "#C62828" : "#2E8B57"} 
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={() => handleDeleteUser(item)} style={styles.iconBtn}>
            <Ionicons name="trash" size={22} color="#C62828" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={styles.center} size="large" color="#2E8B57" />;

  return (
    <View style={styles.container}>
      <FlatList 
        data={users} 
        renderItem={renderUser} 
        keyExtractor={item => item.id} 
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: '#2E8B57', // Active Green
    elevation: 2
  },
  pendingCard: { borderLeftColor: '#FF9800', backgroundColor: '#FFF8E1' }, // Orange for Pending
  blockedCard: { borderLeftColor: '#C62828', opacity: 0.7 }, // Red for Blocked
  userInfo: { flex: 1 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  userEmail: { color: '#666', fontSize: 14 },
  userRole: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginLeft: 5 },
  actionBtn: { padding: 5, marginLeft: 5 },
});