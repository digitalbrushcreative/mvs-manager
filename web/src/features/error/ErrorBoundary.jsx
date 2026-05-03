import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Button, Card } from '../../design-system';
import { Crest } from '../../components/Crest/Crest';
import styles from './ErrorBoundary.module.css';

function describe(error) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        code: '404',
        title: 'Page not found',
        description:
          "The link you followed doesn't lead anywhere. It may have moved, or the address may be mistyped.",
      };
    }
    if (error.status === 401 || error.status === 403) {
      return {
        code: String(error.status),
        title: 'Not authorised',
        description:
          "Your account doesn't have access to this page. Sign in with an account that does, or head back home.",
      };
    }
    return {
      code: String(error.status),
      title: error.statusText || 'Something went wrong',
      description:
        error.data?.message ||
        'The server returned an unexpected response. Please try again in a moment.',
    };
  }

  return {
    code: 'Error',
    title: 'Something went wrong',
    description:
      "An unexpected error occurred while loading this page. Try reloading, or head back to the dashboard.",
  };
}

function detailsText(error) {
  if (!error) return null;
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}\n${
      typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)
    }`;
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n\n${error.stack || ''}`.trim();
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { code, title, description } = describe(error);
  const details = detailsText(error);
  const isDev = import.meta.env?.DEV;

  return (
    <div className={styles.wrap}>
      <Card className={styles.card} padded>
        <div className={styles.brand}>
          <Crest size="lg" />
          <div className={styles.code}>{code}</div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          <Link to="/">
            <Button variant="primary">Go home</Button>
          </Link>
        </div>

        {isDev && details ? (
          <details className={styles.details}>
            <summary>Developer details</summary>
            <pre className={styles.detailsBody}>{details}</pre>
          </details>
        ) : null}
      </Card>
    </div>
  );
}
