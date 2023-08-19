import { useContext } from '@riadh-adrani/ruvy';
import Icon from '../Icon/Icon';
import VolumeSlider from '../Slider/VolumeSlider';
import { PlayerContext } from '../../context/Player.context';
import { formatTime } from '../../utils/time';
import PlayerButton from './Player.Button';

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
    <div class={['row justify-between w-100%', !mini ? 'p-t-3' : 'p-t-2']}>
      <div class={'row-center gap-3'}>
        <PlayerButton icon="i-mdi-skip-previous" />
        <PlayerButton icon={!paused ? 'i-mdi-pause' : 'i-mdi-play'} onClick={() => togglePlay()} />
        <PlayerButton icon="i-mdi-skip-next" />
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
          <PlayerButton icon="i-mdi-play-circle-outline" />
        </div>
        <PlayerButton icon="i-mdi-cog" />
        <PlayerButton
          icon={mini ? 'i-mdi-television' : 'i-mdi-dock-window'}
          onClick={() => toggleMiniPlayer()}
        />
        <PlayerButton if={!mini} icon="i-mdi-panorama-wide-angle-outline" />
        <PlayerButton if={!mini} icon="i-mdi-fullscreen" />
      </div>
    </div>
  );
};
