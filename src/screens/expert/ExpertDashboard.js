import React from 'react';
import { View, Text, Button } from 'react-native';

export default function ExpertDashboard({ navigation }) {
  return (
    <View style={{flex:1,padding:12}}>
      <Text style={{fontSize:18,fontWeight:'700'}}>Expert Dashboard</Text>
      <Button title="Pending Prescriptions" onPress={()=>navigation.navigate('PrescriptionsList')} />
      <Button title="Chat with Farmers" onPress={()=>navigation.navigate('ChatList')} />
      <Button title="Manage Profile" onPress={()=>navigation.navigate('Profile')} />
    </View>
  );
}
