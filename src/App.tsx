import { lazy, Suspense } from 'react';
import { Intro } from './components/shell/Intro';
import { SiteFooter } from './components/shell/SiteFooter';
import { SiteHeader } from './components/shell/SiteHeader';
import { StudioSwitch } from './components/shell/StudioSwitch';
import { ChoosePage } from './pages/ChoosePage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayPage } from './pages/PlayPage';
import { ProjectPage } from './pages/ProjectPage';
import { WorkPage } from './pages/WorkPage';
import { RouterProvider, useRouter } from './router/Router';
import type { Route } from './router/routes';
import { loadStudio } from './studio/load';

// Three.js and the baked studio only load on this route (the selector warms it up on hover).
const StudioPage = lazy(loadStudio);

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'choose':
      return <ChoosePage />;
    case 'home':
      return <HomePage />;
    case 'work':
      return <WorkPage filter={route.filter} />;
    case 'project':
      return <ProjectPage slug={route.slug} />;
    case 'play':
      return <PlayPage slug={route.slug} />;
    case 'studio':
      return (
        <Suspense fallback={null}>
          <StudioPage />
        </Suspense>
      );
    case 'not-found':
      return <NotFoundPage />;
  }
}

/** The selector and the studio are full-screen and bring their own UI; every other page is the editorial site. */
function Shell() {
  const { route } = useRouter();
  if (route.name === 'choose' || route.name === 'studio') {
    return (
      <main id="main">
        <Page route={route} />
      </main>
    );
  }
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main">
        <Page route={route} />
      </main>
      <SiteFooter />
      {route.name !== 'play' && <StudioSwitch />}
    </>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <Intro />
      <Shell />
    </RouterProvider>
  );
}
