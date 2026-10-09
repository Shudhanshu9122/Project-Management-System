import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../theme';
import { Button, TextField } from '../components/Controls';
import { Notice } from '../components/States';
import { validateLoginForm } from '../validation';

export function LoginScreen({ navigation }) {
  const { login, sessionMessage, clearSessionMessage } = useAuth();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit() {
    const validation = validateLoginForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    clearSessionMessage();

    try {
      await login({ email: values.email, password: values.password });
      // The navigator swaps stacks as soon as `user` is set.
    } catch (error) {
      setFormError(error.message || 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.logo, { backgroundColor: theme.brand.brand600 }]}>
          <Text style={styles.logoText}>N</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>PROSHU</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Sign in with the same account you use on the web.
        </Text>

        {sessionMessage ? <Notice tone="warning" icon="time-outline">{sessionMessage}</Notice> : null}
        {formError ? <Notice tone="danger" icon="alert-circle-outline">{formError}</Notice> : null}

        <View style={styles.form}>
          <TextField
            label="Email"
            value={values.email}
            onChangeText={(value) => setField('email', value)}
            error={errors.email}
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            placeholder="you@example.com"
          />

          <TextField
            label="Password"
            value={values.password}
            onChangeText={(value) => setField('password', value)}
            error={errors.password}
            required
            secure
            autoCapitalize="none"
            placeholder="Your password"
          />

          <Button label="Sign in" onPress={handleSubmit} loading={submitting} />
        </View>

        <Pressable
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="button"
          style={styles.switch}
        >
          <Text style={{ color: theme.textMuted }}>
            New here? <Text style={{ color: theme.brand.brand600, fontWeight: '600' }}>Create an account</Text>
          </Text>
        </Pressable>

        <Text style={[styles.demo, { color: theme.textSubtle }]}>
          Demo account: demo@example.com / Password123
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48, gap: 12 },
  logo: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#ffffff', fontSize: 24, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, marginBottom: 8 },
  form: { gap: 16, marginTop: 8 },
  switch: { alignItems: 'center', paddingVertical: 16 },
  demo: { fontSize: 12, textAlign: 'center' },
});
