import { ArrowRight } from 'lucide-react';
import { RevealLines } from '../components/Reveal';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { Link } from '../router/Router';
import { paths } from '../router/routes';

export function NotFoundPage() {
  useDocumentMeta('Page not found');
  return (
    <section className="layer" style={{ paddingTop: 'calc(var(--header-h) + var(--s-10))', minHeight: '70svh' }} aria-labelledby="nf-title">
      <div className="wrap">
        <p className="t-label">Error 404</p>
        <RevealLines as="h1" id="nf-title" className="t-display" lines={['Nothing on', <em key="l">this layer.</em>]} />
        <p className="t-body" style={{ margin: 'var(--s-6) 0' }}>The page you’re looking for doesn’t exist or has moved.</p>
        <Link className="btn btn--primary" to={paths.work()}>
          See all work <ArrowRight className="icon" size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
