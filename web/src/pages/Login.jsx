import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FormField } from '../components/FormField';
import { Spinner } from '../components/Spinner';
import { validateLoginForm } from '../validation';
import { ApiError } from '../api/client';

const HIGHLIGHTS = [
  'One account for the web app and the Android app',
  'Tasks, priorities and due dates in one list',
  'Live progress on every project',
];

export function Login() {
  const { login, user, sessionMessage, clearSessionMessage } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [values, setValues] = useState({ email: '', password: '' });
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

    const validation = validateLoginForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    clearSessionMessage();

    try {
      const account = await login({ email: values.email, password: values.password });
      toast.success('Welcome back', account.fullName);
      navigate('/', { replace: true });
    } catch (error) {
      
      
      setFormError(error.message || 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth__brand">
        <div className="auth__brand-top">
          <span className="sidebar__logo" aria-hidden="true">
            P
          </span>
          <span className="sidebar__wordmark">Proshu</span>
        </div>

        <div className="auth__brand-inner">
          <p className="auth__eyebrow">Project management</p>
          <h1 className="auth__headline">
            Plan the work, track the tasks, and know where every project stands.
          </h1>
          <p className="auth__lede">
            Projects, tasks and progress in one workspace - on the web and on Android.
          </p>

          <ul className="auth__points">
            {HIGHLIGHTS.map((point, index) => (
              <li key={point}>
                <span className="auth__point-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="auth__brand-foot">One account, both platforms.</p>
      </section>

      <section className="auth__panel">
        <div className="auth__card">
          <h1 className="auth__title">Sign in</h1>
          <p className="auth__subtitle">Use the same account on web and mobile.</p>

          {sessionMessage ? (
            <div className="form-alert mb-4" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{sessionMessage}</span>
            </div>
          ) : null}

          {formError ? (
            <div className="form-alert mb-4" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{formError}</span>
            </div>
          ) : null}

          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            <FormField id="login-email" label="Email" required error={errors.email}>
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

            <FormField id="login-password" label="Password" required error={errors.password}>
              {(props) => (
                <div className="input-with-action">
                  <input
                    {...props}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    className={`input ${errors.password ? 'input--invalid' : ''}`}
                    value={values.password}
                    onChange={(event) => setField('password', event.target.value)}
                    placeholder="Your password"
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
              {submitting ? <Spinner size={16} label="Signing in" /> : null}
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth__switch">
            New here? <Link to="/register">Create an account</Link>
          </p>

        </div>
      </section>
    </div>
  );
}
