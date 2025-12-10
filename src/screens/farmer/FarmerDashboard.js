import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LanguageContext } from '../../contexts/LanguageContext';
import { AuthContext } from '../../contexts/AuthContext';

export default function FarmerDashboard({ navigation }) {
  const { t, language, setLanguage } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  const dashboardItems = [
    { title: t('cropProgress'), icon: 'leaf', screen: 'CropProgress', colors: ['#66BB6A', '#43A047'] },
    // --- NEW: My Fields Card ---
    { title: 'My Fields', icon: 'map', screen: 'MyFields', colors: ['#8D6E63', '#5D4037'] }, // Brown for Land
    { title: 'Marketplace', icon: 'storefront', screen: 'Marketplace', colors: ['#FFA726', '#FB8C00'] },
    { title: t('cart'), icon: 'cart', screen: 'Cart', colors: ['#FF7043', '#E64A19'] },
    { title: t('reqPrescription'), icon: 'medkit', screen: 'RequestPrescription', colors: ['#42A5F5', '#1E88E5'] },
    { title: 'My Queries', icon: 'chatbubbles', screen: 'MyQueries', colors: ['#5C6BC0', '#3949AB'] },
    { title: 'AI Chatbot', icon: 'chatbox-ellipses', screen: 'Chatbot', colors: ['#EC407A', '#C2185B'] },
    { title: t('weather'), icon: 'partly-sunny', screen: 'Weather', colors: ['#26C6DA', '#00ACC1'] },
    { title: t('knowledgeHub'), icon: 'book', screen: 'KnowledgeHub', colors: ['#AB47BC', '#8E24AA'] },
    { title: t('tasks'), icon: 'alarm', screen: 'TaskReminders', colors: ['#EF5350', '#E53935'] },
    { title: t('orders'), icon: 'receipt', screen: 'Orders', colors: ['#78909C', '#546E7A'] },
    { title: t('analytics'), icon: 'bar-chart', screen: 'Analytics', colors: ['#009688', '#00796B'] },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#2E8B57', '#1B5E20']} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>Salam, {user?.displayName || 'Farmer'}! 👋</Text>
            <Text style={styles.subText}>{language === 'en' ? 'Manage your farm efficiently' : 'اپنے فارم کا مؤثر طریقے سے انتظام کریں'}</Text>
          </View>
          <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
            <Ionicons name="language" size={16} color="#2E8B57" />
            <Text style={styles.langText}>{language === 'en' ? 'اردو' : 'Eng'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('dashboard')}</Text>
        <View style={styles.grid}>
          {dashboardItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.cardContainer}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={item.colors} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={28} color={item.colors[1]} />
                </View>
                <Text style={styles.cardText}>{item.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{height: 20}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerGradient: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 10 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 5 },
  subText: { fontSize: 14, color: '#E8F5E9', opacity: 0.9 },
  langButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, elevation: 3 },
  langText: { color: '#2E8B57', fontWeight: '700', marginLeft: 6, fontSize: 14 },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 15, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardContainer: { width: '48%', height: 130, marginBottom: 16, borderRadius: 20, elevation: 5 },
  cardGradient: { flex: 1, borderRadius: 20, padding: 15, justifyContent: 'space-between', alignItems: 'flex-start' },
  iconCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center' },
  cardText: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 10 },
});