import { getSearchParams, useContext, useEffect, useState } from '@riadh-adrani/ruvy';
import GButton from '../components/Button/G.Button';

import Icon from '../components/Icon/Icon';
import { PlayerContext } from '../context/Player.context';
import useApi from '../utils/api';
import { UserContext } from '../context/User.context';

export default () => {
  const { isAuthenticated } = useContext(UserContext);
  const { watchElementId, setId, toggleMiniPlayer, data, toggleVideoLike, toggleVideoDislike } =
    useContext(PlayerContext);

  const { v } = getSearchParams();

  useEffect(() => {
    if (v) {
      setId(v);
    }

    toggleMiniPlayer(false);
  }, v);

  const onSubscribeClick = () => {
    if (!data || !isAuthenticated) return;

    useApi.post(`/users/${data.owner.id}/subscribe`).then((it) => {
      console.log(it);
    });
  };

  const [expanded, setExpanded] = useState(false);

  return (
    <div class={'row max-w-100vw flex-1 gap-8 p-y-7 p-x-10'}>
      <div class="flex-col flex-1 gap-3">
        <div id={watchElementId} class="relative w-100% aspect-video bg-zinc-900"></div>
        <div class="text-left col gap-4 m-t-2">
          <h3 class="m-0">{data?.title}</h3>
          <div class="row items-center justify-between">
            <div class="row gap-3">
              <img
                src="https://yt3.googleusercontent.com/ytc/AOPolaQ2iMmw9cWFFjnwa13nBwtZQbl-AqGYkkiTqNaTLg=s176-c-k-c0x00ffffff-no-rj-mo"
                class="h-50px w-50px rounded-50%"
              />
              <div class="col self-center">
                <p class="text-sm">
                  <span>{data?.owner.firstName}</span>
                  <span> </span>
                  <span>{data?.owner.lastName}</span>
                </p>
                <p class="text-xs">
                  <span>{data?.owner.subCount}</span>
                  <span> </span>
                  <span>subscribers</span>
                </p>
              </div>
              <GButton
                class="text-sm p-x-5 self-center rounded-20px p-y-0 bg-white text-[color:black]"
                onClick={onSubscribeClick}
              >
                Subscribe
              </GButton>
            </div>
            <div class="row gap-2">
              <GButton
                class="row-center gap-2 p-x-7 rounded-20px text-md"
                onClick={() => toggleVideoLike(true)}
              >
                <Icon icon="i-mdi-thumb-up" class="text-md" />
                <span>{data?.likesCount}</span>
              </GButton>
              <GButton
                class="row-center gap-2 p-x-7 rounded-20px text-md"
                onClick={() => toggleVideoDislike(true)}
              >
                <Icon icon="i-mdi-thumb-down" />
                <span>{data?.dislikesCount}</span>
              </GButton>
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
                <p>136,915 views | {new Date(data?.createdAt ?? '').toDateString()}</p>
                <p class="text-sm text-clip">{data?.description}</p>
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
