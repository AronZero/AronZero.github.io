import { BlueprintDefs } from './components/project/Blueprint';
import { Intro } from './components/shell/Intro';
import { SiteFooter } from './components/shell/SiteFooter';
import { SiteHeader } from './components/shell/SiteHeader';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlayPage } from './pages/PlayPage';
import { ProjectPage } from './pages/ProjectPage';
import { WorkPage } from './pages/WorkPage';
import { RouterProvider, useRouter } from './router/Router';

function Page() {
  const { route } = useRouter();
  switch (route.name) {
    case 'home':
      return <HomePage />;
    case 'work':
      return <WorkPage filter={route.filter} />;
    case 'project':
      return <ProjectPage slug={route.slug} />;
    case 'play':
      return <PlayPage slug={route.slug} />;
    case 'not-found':
      return <NotFoundPage />;
  }
}

export default function App() {
  return (
    <RouterProvider>
      <a className="skip-link" href="#main">Skip to content</a>
      <Intro />
      <BlueprintDefs />
      <SiteHeader />
      <main id="main">
        <Page />
      </main>
      <SiteFooter />
    </RouterProvider>
  );
}
