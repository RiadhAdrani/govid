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
import Comment from '../components/Comment/Comment';

export default () => {
  const { isAuthenticated, user } = useContext(UserContext);
  const {
    comments,
    addComment,
    watchElementId,
    setId,
    toggleMiniPlayer,
    data,
    toggleVideoLike,
    toggleVideoDislike,
    pinnedComment,
  } = useContext(PlayerContext);

  const [expanded, setExpanded] = useState(false);

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

  const onComment = async () => {
    comment.loading = true;

    try {
      await addComment({ text: comment.text });

      comment.text = '';
    } catch (error) {
    } finally {
      comment.loading = false;
    }
  };

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
          <h3 class="m-0 bg-zinc-900 rounded p-3">{data?.title ?? '...'}</h3>
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
          <div class={'relative p-3 col gap-2 bg-zinc-900 rounded'}>
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
          <div class={['overflow-auto col gap-3 bg-zinc-900 p-3']}>
            <h3 class="row gap-2">
              <Icon icon="i-mdi-light-comment" /> <span>Comments ({comments.length})</span>
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
                class="self-end bg-green-700 rounded-5px row-center gap-2"
                onClick={onComment}
              >
                <Icon icon="i-mdi-send" />
                comment
              </GButton>
            </div>
            <div class="col m-t-2 gap-2 text-start">
              <div if={pinnedComment !== undefined} class="col m-b-5">
                <div class="row items-center text-zinc-400 p-y-2 gap-2">
                  <span class="text-0.8em">Pinned comment</span>
                  <Icon icon="i-mdi-light-pin" />
                </div>
                <Comment comment={pinnedComment!} isPinned />
              </div>
              {comments
                .filter((it) => !pinnedComment || it.id !== pinnedComment.id)
                .map((it) => (
                  <Comment key={it.id} comment={it} />
                ))}
            </div>
          </div>
        </div>
      </div>
      <div class="w-400px hidden lg:flex col h-full gap-2">
        <div class="bg-zinc-900 flex-1 rounded"></div>
      </div>
    </div>
  );
};
