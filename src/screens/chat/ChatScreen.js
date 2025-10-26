import React from 'react';
import { View, Text, Button } from 'react-native';

export default function CartScreen({ navigation }) {
  return (
    <View style={{flex:1,padding:12}}>
      <Text style={{fontSize:18,fontWeight:'700'}}>Cart</Text>
      <Text style={{marginTop:8}}>No items (demo)</Text>
      <Button title="Proceed to Checkout" onPress={()=>navigation.navigate('Checkout')} />
    </View>
  );
}
