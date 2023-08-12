import { useContext } from '@riadh-adrani/ruvy';
import Icon from '../Icon/Icon';
import VolumeSlider from '../Slider/VolumeSlider';
import { PlayerContext } from '../../context/Player.context';
import { formatTime } from '../../utils/time';

export default () => {
  const {
    currentTime,
    duration,
    volume,
    mini,
    paused,
    muted,
    toggleMiniPlayer,
    togglePlay,
    toggleMute,
    setVolume,
  } = useContext(PlayerContext);

  return (
    <div class={['row justify-between w-100%', !mini ? 'p-x-3 p-t-3' : 'p-x-0 p-t-0']}>
      <div class={'row-center gap-3'}>
        <Icon icon="i-mdi-skip-previous" />
        <Icon icon={!paused ? 'i-mdi-pause' : 'i-mdi-play'} onClick={() => togglePlay()} />
        <Icon icon="i-mdi-skip-next" />
        <div class="row-center gap-2">
          <Icon
            icon={
              muted
                ? 'i-mdi-volume-mute'
                : volume < 0.33
                ? 'i-mdi-volume-low'
                : volume < 0.66
                ? 'i-mdi-volume-medium'
                : 'i-mdi-volume-high'
            }
            onClick={() => toggleMute()}
          />
          <VolumeSlider value={volume} max={1} min={0} onChange={setVolume} />
        </div>
        <div class="text-0.8em">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      <div class={'row-center gap-3'}>
        <div class="m-r-50px">
          <Icon icon="i-mdi-play-circle-outline" size="1.5em" />
        </div>
        <Icon icon="i-mdi-cog" size="1.5em" />
        <Icon
          icon={mini ? 'i-mdi-television' : 'i-mdi-dock-window'}
          onClick={() => toggleMiniPlayer()}
        />
        <Icon icon="i-mdi-panorama-wide-angle-outline" size="1.5em" />
        <Icon icon="i-mdi-fullscreen" size="1.5em" />
      </div>
    </div>
  );
};
