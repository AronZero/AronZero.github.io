import { Box } from 'lucide-react';
import { Link } from '../../router/Router';
import { paths, saveExperience } from '../../router/routes';
import { loadStudio } from '../../studio/load';
import styles from './StudioSwitch.module.css';

/** Floating switch to the 3D studio, on every editorial page except the game player (its touch controls sit
 *  at the bottom). Leaning toward it starts loading the studio's chunk. */
export function StudioSwitch() {
  const warm = () => void loadStudio();
  return (
    <Link
      to={paths.studio()}
      className={styles.switch}
      onClick={() => saveExperience('interactive')}
      onPointerEnter={warm}
      onFocus={warm}
    >
      <Box className="icon" size={16} aria-hidden="true" />
      <span>3D studio</span>
    </Link>
  );
}
