import { useContext } from '@riadh-adrani/ruvy';
import { PlayerContext } from '../../context/Player.context';
import GoogleSpinner from '../Spinner/Google.spinner';
import Icon from '../Icon/Icon';
import PlayerOverlay from './Player.overlay';

export default () => {
  const { loadingState } = useContext(PlayerContext);

  return (
    <div class="relative w-100% aspect-video bg-zinc-900">
      <div if={loadingState === 'loading'} class="absolute inset-0px col-center">
        <GoogleSpinner />
      </div>
      <div else-if={loadingState === 'error'} class="absolute inset-0px col-center gap-2">
        <Icon icon="i-mdi-alert-circle" class={'text-5em'} />
        <p>We were unable to fetch the video !</p>
      </div>
      <PlayerOverlay />
    </div>
  );
};
