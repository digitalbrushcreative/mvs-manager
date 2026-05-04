import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button, Card, FormField, FormGrid, Input, useToast } from '../../design-system';
import { useAuth } from '../../lib/auth';
import styles from './Login.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await login(email, password);
      const fallback = session.user?.role === 'parent' ? '/parent' : '/admin/trips';
      const target = location.state?.from?.pathname || fallback;
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed');
      toast.error('Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <Card className={styles.card} padded>
        <div className={styles.brand}>
          <img
            className={styles.logo}
            src="/mvs-logo-icon.svg"
            alt="Mountain View School crest"
          />
          <h1 className={styles.title}>Mountain View School</h1>
          <p className={styles.sub}>Field Trips · Staff &amp; Parent Portal</p>
        </div>

        <form onSubmit={onSubmit}>
          {error ? <div className={styles.error}>{error}</div> : null}

          <FormGrid columns={1}>
            <FormField label="Email" required>
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Password" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FormField>
          </FormGrid>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            className={styles.submit}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className={styles.hint}>
          <strong>Demo credentials</strong>
          <div>
            Admin: <code>admin@mvs.test</code> / <code>admin123</code>
          </div>
          <div>
            Parent: <code>parent@example.com</code> / <code>parent123</code>
          </div>
        </div>

        <Link className={styles.publicLink} to="/parent">
          Browse upcoming trips →
        </Link>
      </Card>
    </div>
  );
}
