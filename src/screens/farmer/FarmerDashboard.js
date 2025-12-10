import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageContext } from '../../contexts/LanguageContext';

export default function FarmerDashboard({ navigation }) {
  const { t, language, setLanguage } = useContext(LanguageContext);

  // Full list of dashboard items restored
  const dashboardItems = [
    {
      title: t('cropProgress'),
      icon: 'leaf-outline',
      screen: 'CropProgress',
      color: '#81C784',
    },
    {
      title: t('reqPrescription'),
      icon: 'medkit-outline',
      screen: 'RequestPrescription',
      color: '#66BB6A',
    },
    {
      title: t('weather'),
      icon: 'cloud-outline',
      screen: 'Weather',
      color: '#4CAF50',
    },
    {
      title: t('knowledgeHub'),
      icon: 'book-outline',
      screen: 'KnowledgeHub',
      color: '#388E3C',
    },
    {
      title: t('tasks'),
      icon: 'alarm-outline',
      screen: 'TaskReminders',
      color: '#2E7D32',
    },
    {
      title: t('orders'),
      icon: 'receipt-outline',
      screen: 'Orders',
      color: '#1B5E20',
    },
    {
      title: t('analytics'),
      icon: 'bar-chart-outline',
      screen: 'Analytics',
      color: '#43A047',
    },
    {
      title: t('cart'),
      icon: 'cart-outline',
      screen: 'Cart',
      color: '#4CAF50',
    },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{t('dashboard')}</Text>
        <TouchableOpacity onPress={toggleLanguage} style={styles.langButton}>
          <Text style={styles.langText}>{language === 'en' ? 'Urdu' : 'English'}</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subText}>
        {language === 'en' ? 'Manage your crops and insights' : 'اپنی فصلوں اور بصیرت کا انتظام کریں'}
      </Text>

      <View style={styles.grid}>
        {dashboardItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Ionicons name={item.icon} size={40} color="#fff" />
            <Text style={styles.cardText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF9',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  langButton: {
    borderWidth: 1,
    borderColor: '#2E8B57',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  langText: {
    color: '#2E8B57',
    fontWeight: '600'
  },
  subText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'left',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    height: 140,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  cardText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});