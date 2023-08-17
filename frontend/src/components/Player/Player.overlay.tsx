import { useContext, useMemo } from '@riadh-adrani/ruvy';
import { PlayerContext } from '../../context/Player.context';
import Icon from '../Icon/Icon';
import PlayerControls from './Player.controls';

export default () => {
  const {
    show,
    paused,
    timeRanges,
    duration,
    progress,
    id,
    muted,
    volume,
    videoElementId,
    onMouseMoved,
    togglePlay,
    onProgress,
    seekTime,
    onTimeUpdated,
    onEnded,
    onPause,
  } = useContext(PlayerContext);

  const videoURL = useMemo(() => (id ? `http://localhost:8080/videos/${id}/watch` : undefined));

  return (
    <div class="w-100% h-100%">
      <div
        class={[
          'absolute inset-0px col z-1 duration-200',
          show || paused ? 'opacity-100' : 'opacity-0',
        ]}
        style={{
          background:
            'linear-gradient(0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 100%)',
        }}
      >
        <div class={'relative flex-1'} onMouseMove={onMouseMoved}>
          <div class="absolute inset-0px col-center" onClick:stop={() => togglePlay()}>
            <div
              key={!paused ? 'play' : 'pause'}
              class="text-3em col-center"
              style={{
                animation: '0.75s 1 player-toggle-play-animation forwards',
              }}
            >
              <Icon icon={!paused ? 'i-mdi-play' : 'i-mdi-pause'} />
            </div>
          </div>
          <div
            class={['absolute m-t-auto bottom-0 right-0 left-0 p-5 col']}
            onClick:stop={() => {}}
          >
            <div class="h-8px">
              <div class={'relative h-4px hover:h-8px bg-zinc-800'} onClick={seekTime}>
                <>
                  {timeRanges.map((it) => (
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
              <PlayerControls />
            </div>
          </div>
        </div>
      </div>
      <video
        id={videoElementId}
        class={['h-100% w-100%']}
        onCanPlay={() => togglePlay(true)}
        onTimeUpdate={onTimeUpdated}
        muted={muted}
        onProgress={onProgress}
        volume={volume}
        onEnded={onEnded}
        onPause={onPause}
      >
        <source src={videoURL} type={'video/mp4'}></source>
      </video>
    </div>
  );
};
