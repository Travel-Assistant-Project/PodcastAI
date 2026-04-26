


import RegisterScreen from '../src/screens/RegisterScreen';
import {Stack, useRouter} from 'expo-router';
import {TouchableOpacity, Text} from 'react-native';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace('/')}>
              <Text style={{color: '#007AFF', fontSize: 17}}>‹ Login </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <RegisterScreen />
    </>
  );
}