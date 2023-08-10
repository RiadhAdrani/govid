import {
  DOMEventHandler,
  Portal,
  PropsWithUtility,
  batch,
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReactive,
  useState,
} from '@riadh-adrani/ruvy';
import { Video } from '../types/video';
import useApi from '../utils/api';
import Player from '../components/Player/Player';
import { UIContext } from './UI.context';

export interface UseRefData<T = unknown> {
  value: T;
}

interface BufferedTimeRange {
  from: number;
  to: number;
}

export type LoadingState = 'loading' | 'error' | 'done';

export interface IPlayerContext {
  id: string | undefined;
  data: Video | undefined;
  timeRanges: Array<BufferedTimeRange>;
  show: boolean;
  muted: boolean;
  volume: number;
  paused: boolean;
  progress: number;
  duration: number;
  mini: boolean;
  fullscreen: boolean;
  theatre: boolean;
  speed: number;
  currentTime: number;
  loadingState: LoadingState;
  miniPlayerId: string;
  videoElementId: string;
  watchElementId: string;

  setId: (id: string) => void;

  onProgress: DOMEventHandler<Event, HTMLVideoElement>;
  togglePlay: (v?: boolean) => void;
  onMouseMoved: () => void;
  toggleMute: (v?: boolean) => void;
  setVolume: (v: number) => void;
  onTimeUpdated: () => void;
  seekTime: DOMEventHandler<MouseEvent, HTMLElement>;
  toggleMiniPlayer: (v?: boolean) => void;
}

export const PlayerContext = createContext<IPlayerContext>({
  data: undefined,
  id: undefined,
  timeRanges: [],
  show: false,
  muted: false,
  volume: 1,
  progress: 0,
  duration: 0,
  paused: true,
  currentTime: 0,
  loadingState: 'loading',
  miniPlayerId: '',
  videoElementId: '',
  watchElementId: '',
  fullscreen: false,
  mini: true,
  speed: 1,
  theatre: true,

  setVolume: () => 0,
  togglePlay: () => 0,
  setId: () => 0,
  onProgress: () => 0,
  onMouseMoved: () => 0,
  toggleMute: () => 0,
  onTimeUpdated: () => 0,
  seekTime: () => 0,
  toggleMiniPlayer: () => 0,
});

export const PlayerProvider = (props: PropsWithUtility<{}>) => {
  const { showToast } = useContext(UIContext);
  const [videoElement, setVideElement] = useState<HTMLVideoElement | undefined>(undefined);

  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);
  const [id, setId] = useState<string | undefined>(undefined);
  const [data, setData] = useState<IPlayerContext['data']>(undefined);
  const [timeRanges, setTimeRanges] = useState<IPlayerContext['timeRanges']>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [currentTime, setCurrentTime] = useState(0);

  const controls = useReactive({
    show: false,
    volume: 1,
    muted: false,
    mini: true,
    fullscreen: false,
    theatre: false,
    speed: 1,
    sinceMouseMoved: Date.now(),
  });

  const uid = useId();

  const miniPlayerId = useMemo(() => `mini-player-el-${uid}`);
  const watchElementId = useMemo(() => `watch-player-el-${uid}`);
  const videoElementId = useMemo(() => `video-el-${uid}`);

  const duration = useMemo<number>(() => {
    if (!videoElement) return 0;

    return videoElement.duration;
  }, videoElement?.duration);

  const paused = useMemo<boolean>(() => {
    if (!videoElement) return true;

    return videoElement.paused;
  }, videoElement?.paused);

  const progress = useMemo<number>(() => {
    if (!videoElement) return 0;

    return (currentTime / duration) * 100;
  }, [videoElement, currentTime]);

  const onProgress: IPlayerContext['onProgress'] = () => {
    if (!videoElement?.duration) {
      return;
    }

    const buffered = videoElement.buffered;

    const out: Array<{ from: number; to: number }> = [];

    for (let i = 0; i < buffered.length; i++) {
      const from = buffered.start(i);
      const to = buffered.end(i);

      out.push({ from, to });
    }

    setTimeRanges(out);
  };

  const togglePlay: IPlayerContext['togglePlay'] = (v) => {
    if (!videoElement) return;

    const value = typeof v === 'boolean' ? v : paused;

    if (value) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  };

  const onMouseMoved: IPlayerContext['onMouseMoved'] = () => {
    if (!videoElement) return;

    const now = Date.now();

    controls.sinceMouseMoved = now;
    controls.show = true;

    setTimeout(() => {
      if (controls.sinceMouseMoved === now) {
        controls.show = false;
      }
    }, 2000);
  };

  const toggleMute: IPlayerContext['toggleMute'] = (v) => {
    if (!videoElement) return;

    const value = typeof v === 'boolean' ? v : !controls.muted;

    controls.muted = value;
  };

  const setVolume: IPlayerContext['setVolume'] = (v) => {
    controls.volume = v;
  };

  const onTimeUpdated: IPlayerContext['onTimeUpdated'] = () => {
    if (!videoElement) return;

    setCurrentTime(videoElement.currentTime);
  };

  const seekTime: IPlayerContext['seekTime'] = (e) => {
    if (!videoElement) return;

    const target = e.currentTarget;

    const width = target.getBoundingClientRect().width;
    const x = e.offsetX;

    const percentage = x / width;

    videoElement.currentTime = percentage * duration;
  };

  const toggleMiniPlayer: IPlayerContext['toggleMiniPlayer'] = (v) => {
    if (!videoElement) return;

    controls.mini = typeof v === 'boolean' ? v : !controls.mini;
  };

  useEffect(() => {
    const miniEl = document.querySelector<HTMLElement>(`#${miniPlayerId}`);
    setTimeout(() => {
      const videoEl = document.querySelector<HTMLVideoElement>(`#${videoElementId}`);
      if (videoEl) {
        setVideElement(videoEl);
      }
    }, 500);

    if (miniEl) {
      setContainer(miniEl);
    }
  });

  const miniPlayerToggleDeps = [controls.mini];

  useEffect(() => {
    const current = controls.mini;

    setTimeout(() => {
      if (current === controls.mini) {
        const videoEl = document.querySelector<HTMLVideoElement>(
          `#${current ? miniPlayerId : watchElementId}`
        );

        if (videoEl) {
          setContainer(videoEl);
        } else {
          showToast({
            component: 'something went wrong when trying to switch to watch page',
            duration: 3000,
            type: 'info',
          });
        }
      }
    }, 50);

    if (!miniPlayerId) {
    }
  }, miniPlayerToggleDeps);

  useEffect(() => {
    if (!container) setId(undefined);
  }, container);

  useEffect(() => {
    if (id === undefined) {
      return;
    }

    useApi
      .get<{ data: Video }>(`/videos/${id}`)
      .then((it) => {
        if (it.data.data) {
          setTimeout(() => {
            batch(() => {
              setData(it.data.data);
              setLoadingState('done');
            });
          }, 1000);
        } else {
          setLoadingState('error');
        }
      })
      .catch(() => {
        setLoadingState('error');
      });
  }, id);

  return (
    <PlayerContext.Provider
      value={{
        ...controls,
        data,
        id,
        timeRanges,
        duration,
        paused,
        progress,
        currentTime,
        setId,
        loadingState,
        miniPlayerId,
        videoElementId,
        watchElementId,
        onProgress,
        togglePlay,
        onMouseMoved,
        toggleMute,
        setVolume,
        onTimeUpdated,
        seekTime,
        toggleMiniPlayer,
      }}
    >
      <Portal if={container !== undefined} container={container as Element}>
        <Player />
      </Portal>
      <div
        id={miniPlayerId}
        class={[
          'fixed  bottom-0px z-10 right-0px aspect-video m-30px bg-zinc-900 overflow-hidden',
          controls.mini ? 'w-500px' : 'w-[0px]',
        ]}
      />

      {props.children}
    </PlayerContext.Provider>
  );
};
