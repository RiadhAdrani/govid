import { PropsWithUtility, useMemo, useRef } from '@riadh-adrani/ruvy';
import { Video } from '../../types/video';
import useWindowSize from '../../hooks/useWindowSize';
import { isInInterval, segmentize } from '@riadh-adrani/utils';

export type VideoGridProps = PropsWithUtility<{
  videos: Array<Video>;
}>;

export default (props: VideoGridProps) => {
  const container = useRef<HTMLDivElement>();

  const { width } = useWindowSize();

  const rows = useMemo<Array<Array<Video>>>(() => {
    if (!container.value) return [];

    let count = 1;

    if (width > 1200) count = 4;
    if (isInInterval(790, width, 1200)) count = 3;
    if (isInInterval(610, width, 789)) count = 2;

    return segmentize(props.videos, count);
  }, [width, container, props.videos]);

  return (
    <div ref={container} class="col gap-4">
      {rows.map((row) => (
        <div class="row gap-2">
          {row.map((video) => (
            <a key={video.id} class="w-210px rounded col gap-2" href={`/watch?v=${video.id}`}>
              <div class="w-full aspect-video bg-zinc-800 rounded"></div>
              <div class="col items-start text-start">
                <div class="text-zinc-300 text-0.9em">{video.title}</div>
                <div class="text-zinc-500 text-0.8em">
                  {video.views} view{video.views > 1 ? 's' : ''}
                </div>
              </div>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
};
