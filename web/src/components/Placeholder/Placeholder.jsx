import { Card, EmptyState } from '../../design-system';
import { PageContainer } from '../PageContainer/PageContainer';
import { PageHeader } from '../PageHeader/PageHeader';

const CONSTRUCTION_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9M9 9V3" />
  </svg>
);

/**
 * Placeholder route for not-yet-ported pages. Renders a consistent shell
 * so navigation works end-to-end while we incrementally port features.
 */
export function Placeholder({ title, description, banner }) {
  return (
    <PageContainer>
      {banner}
      <PageHeader title={title} subtitle={description} />
      <EmptyState
        icon={CONSTRUCTION_ICON}
        title="Coming soon"
        description="This page is still being ported from the legacy app. Routing and navigation are wired up — the UI for this view is next on the list."
      />
    </PageContainer>
  );
}
