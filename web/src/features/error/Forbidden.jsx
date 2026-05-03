import { Link } from 'react-router-dom';
import { Button, EmptyState } from '../../design-system';
import { PageContainer } from '../../components/PageContainer/PageContainer';

export function ForbiddenPage() {
  return (
    <PageContainer>
      <EmptyState
        title="Not authorised"
        description="Your account doesn't have access to this page."
        action={
          <Link to="/auth/login">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        }
      />
    </PageContainer>
  );
}

export function NotFoundPage() {
  return (
    <PageContainer>
      <EmptyState
        title="Page not found"
        description="The link you followed doesn't lead anywhere — try the navigation above."
        action={
          <Link to="/">
            <Button variant="secondary">Go home</Button>
          </Link>
        }
      />
    </PageContainer>
  );
}
