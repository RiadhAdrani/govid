import { getSearchParams, useContext, useEffect, useState } from '@riadh-adrani/ruvy';
import GButton from '../components/Button/G.Button';

import Icon from '../components/Icon/Icon';
import { PlayerContext } from '../context/Player.context';

export default () => {
  const { watchElementId, setId } = useContext(PlayerContext);

  const { v } = getSearchParams();

  useEffect(() => {
    if (v) {
      setId(v);
    }
  }, v);

  const [expanded, setExpanded] = useState(false);

  return (
    <div class={'row max-w-100vw flex-1 gap-8 p-y-7 p-x-10'}>
      <div class="flex-col flex-1 gap-3">
        <div id={watchElementId} class="relative w-100% aspect-video bg-zinc-900"></div>
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
                <Icon icon="i-mdi-thumb-up" class="w-10px h-10px" />
                <span>12K</span>
              </GButton>
              <GButton class="row-center gap-2 p-x-7 rounded-20px text-md">
                <Icon icon="i-mdi-thumb-down" />
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
