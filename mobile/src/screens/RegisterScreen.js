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
import { ApiError } from '../api/client';
import { validateRegisterForm } from '../validation';

export function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [values, setValues] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit() {
    const validation = validateRegisterForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await register({
        fullName: values.fullName.trim(),
        email: values.email,
        password: values.password,
      });
    } catch (error) {
      const fields = error instanceof ApiError ? error.fieldErrors() : {};
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(error.message || 'Could not create the account.');
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          One login for the web and Android apps.
        </Text>

        {formError ? <Notice tone="danger" icon="alert-circle-outline">{formError}</Notice> : null}

        <View style={styles.form}>
          <TextField
            label="Full name"
            value={values.fullName}
            onChangeText={(value) => setField('fullName', value)}
            error={errors.fullName}
            required
            autoCapitalize="words"
            textContentType="name"
            placeholder="Ada Lovelace"
          />

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
            placeholder="Choose a password"
            hint="At least 8 characters, with a letter and a number."
          />

          <Button label="Create account" onPress={handleSubmit} loading={submitting} />
        </View>

        <Pressable
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          style={styles.switch}
        >
          <Text style={{ color: theme.textMuted }}>
            Already have an account?{' '}
            <Text style={{ color: theme.brand.brand600, fontWeight: '600' }}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingBottom: 48, gap: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 15, marginBottom: 4 },
  form: { gap: 16, marginTop: 8 },
  switch: { alignItems: 'center', paddingVertical: 16 },
});
