import React from 'react';
import { View, Text, Button } from 'react-native';

export default function AdminDashboard({ navigation }) {
  return (
    <View style={{flex:1,padding:12}}>
      <Text style={{fontSize:18,fontWeight:'700'}}>Admin Dashboard</Text>
      <Button title="Manage Users" onPress={()=>navigation.navigate('ManageUsers')} />
      <Button title="Manage Sellers" onPress={()=>navigation.navigate('ManageSellers')} />
      <Button title="Manage Blogs" onPress={()=>navigation.navigate('ManageBlogs')} />
      <Button title="View Reports/Analytics" onPress={()=>navigation.navigate('Analytics')} />
    </View>
  );
}
