import {
  DOMEventHandler,
  getSearchParams,
  useEffect,
  useMemo,
  useReactive,
  useRef,
  useState,
} from '@riadh-adrani/ruvy';
import GButton from '../components/Button/G.Button';
import { formatTime } from '../utils/time';
import Icon from '../components/Icon/Icon';
import VolumeSlider from '../components/Slider/VolumeSlider';

interface BufferedTime {
  from: number;
  to: number;
}

export default () => {
  const videoPlayerElement = useRef<HTMLVideoElement>();

  const [expanded, setExpanded] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState<Array<BufferedTime>>([]);
  const [muted, setMuted] = useState(false);

  const controls = useReactive({
    show: false,
    timeSinceMouseMoved: Date.now(),
    muted: false,
    volume: 1,
  });

  const isPlaying = useMemo(() => {
    if (!videoPlayerElement.value) return false;

    return !videoPlayerElement.value.paused;
  }, videoPlayerElement.value?.paused);

  const { v } = getSearchParams();

  const id = useMemo(() => v, v);

  const duration = useMemo(
    () => videoPlayerElement.value?.duration ?? 0,
    videoPlayerElement.value?.duration
  );

  const progress = useMemo(() => {
    return (currentTime / duration) * 100;
  }, [duration, currentTime]);

  const togglePlay = (value?: boolean) => {
    if (!videoPlayerElement.value) return;

    videoPlayerElement.value.paused;

    const shouldPlay = typeof value === 'boolean' ? value : !isPlaying;

    if (shouldPlay) {
      videoPlayerElement.value?.play().catch();
    } else {
      videoPlayerElement.value?.pause();
    }
  };

  const onProgress: DOMEventHandler<Event, HTMLVideoElement> = () => {
    if (!videoPlayerElement.value?.duration) return;

    const buffered = videoPlayerElement.value.buffered;

    const out: Array<{ from: number; to: number }> = [];

    for (let i = 0; i < buffered.length; i++) {
      const from = buffered.start(i);
      const to = buffered.end(i);

      out.push({ from, to });
    }

    setBuffered(out);
  };

  const changeTime: DOMEventHandler<MouseEvent, HTMLDivElement> = (e) => {
    if (!videoPlayerElement.value) return;

    const target = e.currentTarget;

    const width = target.getBoundingClientRect().width;
    const x = e.offsetX;

    const percentage = x / width;

    videoPlayerElement.value.currentTime = percentage * duration;
  };

  useEffect(() => {
    if (!canPlay) return;

    videoPlayerElement.value?.play().catch(() => 0);
  }, canPlay);

  return (
    <div class={'row max-w-100vw flex-1 gap-8 p-y-7 p-x-10'}>
      <div class="flex-col flex-1 gap-3">
        <div class="relative">
          <div
            class={[
              'absolute inset-0px col z-1 duration-200',
              controls.show || !isPlaying ? 'opacity-100' : 'opacity-0',
            ]}
            style={{
              background:
                'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 100%)',
            }}
          >
            <div
              class={'relative flex-1'}
              onMouseMove={() => {
                const now = Date.now();

                controls.show = true;
                controls.timeSinceMouseMoved = now;

                setTimeout(() => {
                  if (controls.timeSinceMouseMoved === now) {
                    controls.show = false;
                  }
                }, 2000);
              }}
            >
              <div class="absolute inset-0px col-center" onClick:stop={() => togglePlay()}>
                <div
                  if={isPlaying}
                  class="text-5em"
                  style={{
                    animation: '0.75s 1 player-toggle-play-animation forwards',
                  }}
                >
                  <Icon icon={'play'} />
                </div>
                <div
                  else
                  class="text-5em"
                  style={{
                    animation: '0.75s 1 player-toggle-play-animation forwards',
                  }}
                >
                  <Icon icon={'pause'} />
                </div>
              </div>
              <div
                class={['absolute m-t-auto bottom-0 right-0 left-0 p-5 col']}
                onClick:stop={() => {}}
              >
                <div class="h-8px">
                  <div class={'relative h-4px hover:h-8px bg-zinc-800'} onClick={changeTime}>
                    <>
                      {buffered.map((it) => (
                        <div
                          class={'absolute h-full bg-zinc-600 z-1 duration-200'}
                          style={{
                            left: `${(it.from / duration) * 100}%`,
                            width: `${((it.to - it.from) / duration) * 100}%`,
                          }}
                        />
                      ))}
                    </>
                    <div class={'absolute h-full bg-green z-2'} style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div class="row justify-between p-x-3 p-t-3">
                  <div class={'row-center gap-3'}>
                    <Icon icon="skip-previous" size="1.5em" />
                    <Icon
                      icon={isPlaying ? 'pause' : 'play'}
                      size="1.5em"
                      onClick={() => togglePlay()}
                    />
                    <Icon icon="skip-next" size="1.5em" />
                    <div class="row-center gap-2">
                      <Icon
                        icon={
                          muted
                            ? 'volume-mute'
                            : controls.volume < 0.33
                            ? 'volume-low'
                            : controls.volume < 0.66
                            ? 'volume-medium'
                            : 'volume-high'
                        }
                        size="1.5em"
                        onClick={() => setMuted(!muted)}
                      />
                      <VolumeSlider
                        value={controls.volume}
                        max={1}
                        min={0}
                        onChange={(v) => {
                          controls.volume = v;
                        }}
                      />
                    </div>
                    <div class="text-0.8em">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                  <div class={'row-center gap-3'}>
                    <div class="m-r-50px">
                      <Icon icon="play-circle-outline" size="1.5em" />
                    </div>
                    <Icon icon="cog" size="1.5em" />
                    <Icon icon="dock-window" size="1.5em" />
                    <Icon icon="panorama-wide-angle-outline" size="1.5em" />
                    <Icon icon="fullscreen" size="1.5em" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <video
            class={'w-100%'}
            onCanPlay={() => setCanPlay(true)}
            ref={videoPlayerElement}
            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime);
            }}
            muted={muted}
            onProgress={onProgress}
            volume={controls.volume}
          >
            <source src={`http://localhost:8080/videos/watch/${id}`} type={'video/mp4'}></source>
          </video>
        </div>
        <div class="text-left col gap-4 m-t-2">
          <h3 class="m-0">Some video title</h3>
          <div class="row items-center justify-between">
            <div class="row gap-3">
              <img
                src="https://yt3.googleusercontent.com/ytc/AOPolaQ2iMmw9cWFFjnwa13nBwtZQbl-AqGYkkiTqNaTLg=s176-c-k-c0x00ffffff-no-rj-mo"
                class="h-50px w-50px rounded-50%"
              />
              <div class="col self-center">
                <p class="text-sm">Channel name</p>
                <p class="text-xs">9.99M subscribers</p>
              </div>
              <GButton class="text-sm p-x-5 self-center rounded-20px p-y-0 bg-white text-[color:black]">
                Subscribe
              </GButton>
            </div>
            <div class="row gap-2">
              <GButton class="row-center gap-2 p-x-7 rounded-20px text-md">
                {/* <Icon icon="thumb-up" class="w-10px h-10px" /> */}
                <span>12K</span>
              </GButton>
              <GButton class="row-center gap-2 p-x-7 rounded-20px text-md">
                {/* <Icon icon="thumb-down" /> */}
                <span>1K</span>
              </GButton>
              <GButton class="p-x-5 rounded-20px">Download</GButton>
              <GButton class="p-x-5 rounded-20px">Share</GButton>
              <GButton class="p-x-5 rounded-20px">
                <span class="i-mdi-light-home"></span> Save
              </GButton>
            </div>
          </div>
          <div class={'relative p-3 col gap-2 bg-zinc-800 rounded-10px'}>
            <div
              class={`grid`}
              style={{
                gridTemplateRows: expanded ? '1fr' : '110px',
                transition: 'grid-template-rows 200ms',
              }}
            >
              <div class="relative col gap-1 overflow-hidden">
                <p>136,915 views Jul 7, 2023</p>
                <p class="text-sm text-clip">Khouloud is stupid</p>
              </div>
            </div>
            <button class="self-start p-y-1 p-x-3" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>
      </div>
      <div class={'w-450px'}></div>
    </div>
  );
};
