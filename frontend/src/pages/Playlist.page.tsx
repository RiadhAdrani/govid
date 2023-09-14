import { getParams, useEffect, useState } from '@riadh-adrani/ruvy';
import { Playlist, PlaylistVideo } from '../types/video';
import useApi from '../utils/api';
import { ApiResponse } from '../types/api';
import Icon from '../components/Icon/Icon';
import GButton from '../components/Button/G.Button';

export default () => {
  const { id } = getParams();

  const [playlist, setPlaylist] = useState<Playlist | undefined>(undefined);
  const [items, setItems] = useState<Array<PlaylistVideo>>([]);

  useEffect(() => {
    if (!id) return;

    useApi
      .get<ApiResponse<Playlist, { items: Array<PlaylistVideo> }>>(`/playlists/${id}`)
      .then((it) => {
        const data = it.data;

        if (!it.data) return;

        setPlaylist(data.data);
        setItems(data.items);
      });
  }, [id]);

  return (
    <div class="row flex-1 w-full">
      <div if={playlist !== undefined} class="col gap-2 text-start p-x-2 p-y-4 w-300px bg-zinc-900">
        <Icon icon="i-mdi-playlist-play" class="text-2em text-zinc-500 m-b-3" />
        <p class="text-2em">{playlist?.title}</p>
        <p class="text-zinc-400">
          created by {playlist?.owner.firstName} {playlist?.owner.lastName}
        </p>
        <p class="text-zinc-400">{playlist?.description}</p>
        <GButton class="bg-green-700 m-t-3">
          <Icon icon="i-mdi-play" />
        </GButton>
      </div>
      <div>
        
      </div>
    </div>
  );
};
