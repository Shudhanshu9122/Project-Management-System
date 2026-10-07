import { Alert, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../api/network';
import { useAppTheme } from '../theme';
import { Card, Screen, SectionTitle } from '../components/Layout';
import { Button } from '../components/Controls';
import { Notice, OfflineBanner } from '../components/States';

const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api').replace(/\/$/, '');

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const theme = useAppTheme();
  const isOnline = useNetworkStatus();

  function confirmLogout() {
    Alert.alert('Log out', 'You will need to sign in again on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <Screen>
      <OfflineBanner visible={!isOnline} />

      <Card style={{ gap: 6 }}>
        <Text style={[styles.name, { color: theme.text }]}>{user.fullName}</Text>
        <Text style={{ color: theme.textMuted }}>{user.email}</Text>
        <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </Text>
      </Card>

      <View>
        <SectionTitle>Connection</SectionTitle>
        <Card style={{ gap: 6 }}>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            API endpoint: {API_BASE}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            Status: {isOnline ? 'Online' : 'Offline'}
          </Text>
        </Card>
      </View>

      <Notice tone="info" icon="lock-closed-outline">
        Your token is stored in the Android Keystore through expo-secure-store. Logging out revokes it on
        the server straight away.
      </Notice>

      <Button label="Log out" variant="danger" icon="log-out-outline" onPress={confirmLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 20, fontWeight: '700' },
});
