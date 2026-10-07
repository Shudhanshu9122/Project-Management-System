import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FormField } from '../components/FormField';
import { Spinner } from '../components/Spinner';
import { validateRegisterForm } from '../validation';
import { ApiError } from '../api/client';

const HIGHLIGHTS = [
  'Projects with status, dates and progress',
  'Tasks with priority, due dates and filters',
  'Dashboard totals for everything you own',
];

export function Register() {
  const { register, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validation = validateRegisterForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const account = await register({
        fullName: values.fullName.trim(),
        email: values.email,
        password: values.password,
      });
      toast.success('Account created', `Signed in as ${account.fullName}`);
      navigate('/', { replace: true });
    } catch (error) {
      // The server's per-field errors (for example a duplicate email) take
      // priority over a generic banner.
      const fields = error instanceof ApiError ? error.fieldErrors() : {};
      if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(error.message || 'Could not create the account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth__brand">
        <div className="auth__brand-inner">
          <h1 className="auth__headline">Start with Northstar</h1>
          <p className="auth__lede">
            One place for the projects you own and the tasks that move them forward.
          </p>
        </div>

        <ul className="auth__points">
          {HIGHLIGHTS.map((point) => (
            <li key={point}>
              <CheckCircle2 size={18} aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="auth__panel">
        <div className="auth__card">
          <h2 className="auth__title">Create your account</h2>
          <p className="auth__subtitle">Free, and the same login works on the Android app.</p>

          {formError ? (
            <div className="form-alert mb-4" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{formError}</span>
            </div>
          ) : null}

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            <FormField id="register-name" label="Full name" required error={errors.fullName}>
              {(props) => (
                <input
                  {...props}
                  name="name"
                  autoComplete="name"
                  className={`input ${errors.fullName ? 'input--invalid' : ''}`}
                  value={values.fullName}
                  onChange={(event) => setField('fullName', event.target.value)}
                  placeholder="Ada Lovelace"
                />
              )}
            </FormField>

            <FormField id="register-email" label="Email" required error={errors.email}>
              {(props) => (
                <input
                  {...props}
                  type="email"
                  name="email"
                  autoComplete="email"
                  className={`input ${errors.email ? 'input--invalid' : ''}`}
                  value={values.email}
                  onChange={(event) => setField('email', event.target.value)}
                  placeholder="you@example.com"
                />
              )}
            </FormField>

            <FormField
              id="register-password"
              label="Password"
              required
              error={errors.password}
              hint="At least 8 characters, with a letter and a number."
            >
              {(props) => (
                <div className="input-with-action">
                  <input
                    {...props}
                    type={showPassword ? 'text' : 'password'}
                    name="new-password"
                    autoComplete="new-password"
                    className={`input ${errors.password ? 'input--invalid' : ''}`}
                    value={values.password}
                    onChange={(event) => setField('password', event.target.value)}
                    placeholder="Choose a password"
                  />
                  <button
                    type="button"
                    className="input-with-action__button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
              )}
            </FormField>

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? <Spinner size={16} label="Creating account" /> : null}
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="auth__switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
