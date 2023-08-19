import {
  getSearchParams,
  useContext,
  useEffect,
  useMemo,
  useReactive,
  useState,
} from '@riadh-adrani/ruvy';
import GButton from '../components/Button/G.Button';

import Icon from '../components/Icon/Icon';
import { PlayerContext } from '../context/Player.context';
import useApi from '../utils/api';
import { UserContext } from '../context/User.context';
import {
  CreateVideoCommentBody,
  CreateVideoCommentResponse,
  GetVideoCommentResponse,
  VideoComment,
} from '../types/video';

export default () => {
  const { isAuthenticated, user } = useContext(UserContext);
  const {
    watchElementId,
    setId,
    toggleMiniPlayer,
    data,
    toggleVideoLike,
    toggleVideoDislike,
    dimensions,
  } = useContext(PlayerContext);

  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Array<VideoComment>>([]);

  const { v } = getSearchParams();

  const ratio = useMemo(() => {
    if (!data) return { likes: 0, dislikes: 0 };

    const likes = data.likesCount;
    const dislikes = data.dislikesCount;
    const sum = likes + dislikes;

    return {
      likes: (likes / sum) * 100,
      dislikes: (dislikes / sum) * 100,
    };
  }, [data?.likesCount, data?.dislikesCount]);

  const onSubscribeClick = () => {
    if (!data || !isAuthenticated) return;

    useApi.post(`/users/${data.owner.id}/subscribe`);
  };

  const comment = useReactive({ text: '', loading: false, error: '' });

  const onComment = () => {
    if (!isAuthenticated) return;

    comment.loading = true;

    const body: CreateVideoCommentBody = { text: comment.text };

    useApi
      .post<CreateVideoCommentResponse>(`/videos/${data?.id}/comments`, body)
      .then((res) => {
        if (!res.data.data) return;

        comment.text = '';

        setComments([res.data.data, ...comments]);
      })
      .catch((e) => {
        comment.error = e;
      })
      .finally(() => {
        comment.loading = false;
      });
  };

  useEffect(() => {
    if (data?.id === undefined) return;

    useApi
      .get<GetVideoCommentResponse>(`/videos/${data.id}/comments?from=0&count=10`)
      .then((res) => {
        if (!res.data.data) return;

        setComments(res.data.data);
      });
  }, data?.id);

  useEffect(() => {
    if (v) {
      setId(v);
    }

    toggleMiniPlayer(false);
  }, v);

  return (
    <div class={'row max-w-100vw flex-1 gap-8 p-y-7 p-x-10'}>
      <div class="flex-col flex-1 gap-3">
        <div id={watchElementId} class="relative w-100% aspect-video bg-zinc-900"></div>
        <div class="text-left col gap-4 m-t-2">
          <h3 class="m-0">{data?.title ?? '...'}</h3>
          <div class="row items-center justify-between">
            <div class="row gap-3">
              <img
                src="https://yt3.googleusercontent.com/ytc/AOPolaQ2iMmw9cWFFjnwa13nBwtZQbl-AqGYkkiTqNaTLg=s176-c-k-c0x00ffffff-no-rj-mo"
                class="h-50px w-50px rounded-50%"
              />
              <div class="col self-center">
                <p class="text-sm">
                  {data?.owner.firstName ?? '...'} {data?.owner.lastName ?? '...'}
                </p>
                <p class="text-xs">{data?.owner.subCount ?? 0} subscribers</p>
              </div>
              <GButton
                if={user?.id !== data?.owner.id}
                class="text-sm p-x-5 self-center rounded-20px p-y-0 bg-white text-[color:black]"
                onClick={onSubscribeClick}
              >
                Subscribe
              </GButton>
            </div>
            <div class="row gap-2">
              <div class="relative col">
                <div class="row flex-1">
                  <div
                    class={['action-btn', data?.isLiked && 'text-green-500']}
                    onClick={() => toggleVideoLike(true)}
                  >
                    <Icon icon="i-mdi-thumb-up" class="text-md" />
                    <span>{data?.likesCount ?? 0}</span>
                  </div>
                  <div
                    class={['action-btn', data?.isDisliked && 'text-red-500']}
                    onClick={() => toggleVideoDislike(true)}
                  >
                    <Icon icon="i-mdi-thumb-down" class="text-md" />
                    <span>{data?.dislikesCount ?? 0}</span>
                  </div>
                </div>
                <div class="absolute row bottom-0px bg-zinc-800 rounded w-100% h-2px">
                  <div
                    class="h-100% bg-green-500 duration-200"
                    style={{ width: `${ratio.likes}%` }}
                  />
                  <div
                    class="h-100% bg-red-500 duration-200"
                    style={{ width: `${ratio.dislikes}%` }}
                  />
                </div>
              </div>
              <div class="action-btn">
                <Icon icon="i-mdi-playlist-plus" />
                <span>Save</span>
              </div>
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
                <p>
                  <span>
                    {data?.views} {data && data.views > 1 ? 'views' : 'view'}
                  </span>
                  <span> | </span>
                  <span>{new Date(data?.createdAt ?? '').toDateString()}</span>
                </p>
                <p class="text-sm text-clip">{data?.description}</p>
              </div>
            </div>
            <button class="self-start p-y-1 p-x-3" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>
      </div>
      <div class="w-400px col h-full gap-2">
        <div
          class={['overflow-auto col gap-3 bg-zinc-900 p-x-4 p-y-3']}
          style={{ height: `${dimensions.height}px`, boxSizing: 'border-box' }}
        >
          <h3 class="row gap-2">
            <Icon icon="i-mdi-comment" /> Comments
          </h3>
          <div class="col gap-2">
            <input
              class={[
                'bg-transparent p-2 text-1.2em',
                'border-none border-b-1 border-b-solid border-b-zinc-700 focus:border-b-zinc-400',
                'focus:outline-none',
              ]}
              disabled={comment.loading}
              onInput={(e) => (comment.text = e.currentTarget.value)}
              value={comment.text}
              placeholder="Write a new comment..."
            />
            <GButton
              disabled={comment.loading}
              class="self-end bg-green-700 rounded-5px"
              onClick={onComment}
            >
              comment
            </GButton>
          </div>
          <div class="col m-t-2 gap-2 text-start">
            {comments.map((it) => (
              <div key={it.id} class="row gap-5 p-2 bg-zinc-800 rounded">
                <img
                  src="https://yt3.googleusercontent.com/ytc/AOPolaQ2iMmw9cWFFjnwa13nBwtZQbl-AqGYkkiTqNaTLg=s176-c-k-c0x00ffffff-no-rj-mo"
                  class="h-30px w-30px rounded-50%"
                />
                <div class="col items-start gap-1 flex-1">
                  <div class="row-center h-30px gap-2">
                    <span>
                      {it.user.firstName} {it.user.lastName}
                    </span>
                    <span class="text-zinc-400 text-[0.8em]">
                      {new Date(it.createdAt).toDateString()}
                    </span>
                  </div>
                  <div>{it.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div class="bg-zinc-900 flex-1 rounded"></div>
      </div>
    </div>
  );
};
