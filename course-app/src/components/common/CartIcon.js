import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const CartIcon = () => {
  const navigation = useNavigation();
  const totalItems = useSelector(state => state.cart.totalItems);

  return (
    <TouchableOpacity
      className="p-2 border border-gray-200 bg-white rounded-full shadow-sm relative"
      onPress={() => navigation.navigate('CartScreen')}
      activeOpacity={0.8}
    >
      <ShoppingCart size={24} color="#6b7280" />
      {totalItems > 0 && (
        <View className="absolute -top-1 -right-1 bg-rose-500 rounded-full w-5 h-5 items-center justify-center border-2 border-white">
          <Text className="text-white text-xs font-bold">{totalItems}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CartIcon;