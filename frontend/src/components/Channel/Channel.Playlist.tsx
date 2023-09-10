import { PropsWithUtility, useEffect, useMemo, useRef, useState } from '@riadh-adrani/ruvy';
import { PublicUser } from '../../types/user';
import useApi from '../../utils/api';
import { ApiResponse } from '../../types/api';
import { Playlist } from '../../types/video';
import useWindowSize from '../../hooks/useWindowSize';
import { isInInterval, segmentize } from '@riadh-adrani/utils';
import Icon from '../Icon/Icon';

export default (props: PropsWithUtility<{ user: PublicUser }>) => {
  const [playlists, setPlaylists] = useState<Array<Playlist>>([]);

  useEffect(() => {
    useApi
      .get<ApiResponse<Array<Playlist>>>(`/playlists/users/${props.user.id}?from=0&count=10`)
      .then((it) => {
        const items = it.data.data;

        if (!items) return;

        setPlaylists(items);
      });
  });

  const container = useRef<HTMLDivElement>();

  const { width } = useWindowSize();

  const rows = useMemo<Array<Array<Playlist>>>(() => {
    if (!container.value) return [];

    let count = 1;

    if (width > 1199) count = 4;
    else if (isInInterval(790, width, 1200)) count = 3;
    else if (isInInterval(610, width, 790)) count = 2;

    return segmentize(playlists, count);
  }, [width, container, playlists]);

  return (
    <div class="col-center flex-1 p-y-5">
      <div ref={container} class="col gap-4">
        {rows.map((row) => (
          <div class="row gap-2">
            {row.map((item) => (
              <div key={item.id} class="w-210px rounded col gap-2">
                <div class="relative w-full aspect-video bg-zinc-800 rounded col-center">
                  <Icon icon="i-mdi-playlist-play absolute text-2em" />
                </div>
                <div class="col items-start text-start">
                  <div class="text-zinc-300 text-0.9em">{item.title}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
