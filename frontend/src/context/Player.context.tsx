import { PropsWithUtility, createContext, useState } from '@riadh-adrani/ruvy';
import useToggle from '../hooks/useToggle';

export interface IPlayerContext {
  id: string | undefined;
  video: object;
  isPlaying: boolean;
  progress: number;
  settings: {
    volume: number;
    speed: number;
    miniPlayer: boolean;
    autoPlay: boolean;
    fullScreen: boolean;
  };

  setVideoId: (id: string | undefined) => void;

  changeVolume: (v: number) => void;
  changeSpeed: (v: number) => void;

  updateProgress: (v: number) => void;

  togglePlay: (v?: boolean) => void;
  toggleMiniPlayer: (v?: boolean) => void;
  toggleFullscreen: (v?: boolean) => void;
  toggleAutoplay: (v?: boolean) => void;
}

const PlayerContext = createContext<IPlayerContext>({
  id: undefined,
  video: {},
  isPlaying: false,
  progress: 0,
  settings: { autoPlay: false, fullScreen: false, miniPlayer: false, speed: 1, volume: 1 },

  setVideoId: () => 0,

  changeSpeed: () => 0,
  changeVolume: () => 0,

  updateProgress: () => 0,
  togglePlay: () => 0,
  toggleMiniPlayer: () => 0,
  toggleFullscreen: () => 0,
  toggleAutoplay: () => 0,
});

export const PlayerProvider = (props: PropsWithUtility<{}>) => {
  const [id, setId] = useState<string | undefined>(undefined);
  const [video] = useState<object>({});
  const [isPlaying, togglePlay] = useToggle(false);
  const [progress, updateProgress] = useState(0);
  const [volume, changeVolume] = useState(1);
  const [speed, changeSpeed] = useState(1);
  const [miniPlayer, toggleMiniPlayer] = useToggle(false);
  const [fullScreen, toggleFullscreen] = useToggle(false);
  const [autoPlay, toggleAutoplay] = useToggle(false);

  const setVideoId: IPlayerContext['setVideoId'] = (id) => setId(id);

  return (
    <PlayerContext.Provider
      value={{
        id,
        setVideoId,
        video,
        changeSpeed,
        changeVolume,
        isPlaying,
        togglePlay,
        progress,
        updateProgress,
        toggleAutoplay,
        toggleFullscreen,
        toggleMiniPlayer,
        settings: { autoPlay, fullScreen, miniPlayer, speed, volume },
      }}
    >
      {props.children}
    </PlayerContext.Provider>
  );
};
