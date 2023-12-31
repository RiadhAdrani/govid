import {
  DOMEventHandler,
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
import {
  CreateVideoCommentBody,
  CreateVideoCommentResponse,
  GetVideoCommentResponse,
  UpdateVideoCommentBody,
  UpdateVideoCommentResponse,
  Video,
  VideoComment,
} from '../types/video';
import useApi from '../utils/api';
import { UserContext } from './User.context';
import { ApiResponse } from '../types/api';
import useWindowSize from '../hooks/useWindowSize';
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
  comments: Array<VideoComment>;
  pinnedComment: VideoComment | undefined;

  dimensions: { height: number; width: number };

  setId: (id: string) => void;

  onProgress: DOMEventHandler<Event, HTMLVideoElement>;
  togglePlay: (v?: boolean) => void;
  onMouseMoved: () => void;
  toggleMute: (v?: boolean) => void;
  setVolume: (v: number) => void;
  onTimeUpdated: () => void;
  onPause: () => void;
  onEnded: () => void;
  seekTime: DOMEventHandler<MouseEvent, HTMLElement>;
  toggleMiniPlayer: (v?: boolean) => void;

  toggleVideoLike: (v?: boolean) => void;
  toggleVideoDislike: (v?: boolean) => void;

  editComment: (id: number, body: UpdateVideoCommentBody) => Promise<void>;
  deleteComment: (id: number) => Promise<void>;
  addComment: (body: CreateVideoCommentBody) => Promise<void>;

  pinComment: (id: number) => Promise<void>;
  unpinComment: (id: number) => Promise<void>;

  likeComment: (id: number) => Promise<void>;
  unlikeComment: (id: number) => Promise<void>;

  dislikeComment: (id: number) => Promise<void>;
  unDislikeComment: (id: number) => Promise<void>;

  heartComment: (id: number) => Promise<void>;
  unHeartComment: (id: number) => Promise<void>;

  setVideoElement: (el: HTMLVideoElement) => void;
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
  onPause: () => 0,
  onEnded: () => 0,

  setVolume: () => 0,
  togglePlay: () => 0,
  setId: () => 0,
  onProgress: () => 0,
  onMouseMoved: () => 0,
  toggleMute: () => 0,
  onTimeUpdated: () => 0,
  seekTime: () => 0,
  toggleMiniPlayer: () => 0,
  toggleVideoDislike: () => 0,
  toggleVideoLike: () => 0,
  dimensions: { height: 0, width: 0 },

  deleteComment: async () => undefined,
  editComment: async () => undefined,
  addComment: async () => undefined,
  pinComment: async () => undefined,
  unpinComment: async () => undefined,

  likeComment: async () => undefined,
  unlikeComment: async () => undefined,
  dislikeComment: async () => undefined,
  unDislikeComment: async () => undefined,
  heartComment: async () => undefined,
  unHeartComment: async () => undefined,

  setVideoElement: () => 0,

  comments: [],
  pinnedComment: undefined,
});

export const PlayerProvider = (props: PropsWithUtility) => {
  /**
     ███████╗████████╗ █████╗ ████████╗███████╗
     ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██╔════╝
     ███████╗   ██║   ███████║   ██║   █████╗  
     ╚════██║   ██║   ██╔══██║   ██║   ██╔══╝  
     ███████║   ██║   ██║  ██║   ██║   ███████╗
     ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚══════╝                                   
   */

  const { showToast } = useContext(UIContext);
  const { isAuthenticated, user } = useContext(UserContext);

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | undefined>(undefined);

  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);
  const [id, setId] = useState<string | undefined>(undefined);
  const [data, setData] = useState<IPlayerContext['data']>(undefined);
  const [timeRanges, setTimeRanges] = useState<IPlayerContext['timeRanges']>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');

  const [currentTime, setCurrentTime] = useState(0);
  const [previousTime, setPreviousTime] = useState(0);

  const [watchTime, setWatchTime] = useState(0);
  const [watchSegments, setWatchSegments] = useState<Array<{ from: number; to: number }>>([]);

  const [isViewCounted, setViewCounted] = useState(false);

  const [comments, setComments] = useState<Array<VideoComment>>([]);
  const [pinnedId, setPinnedId] = useState<number | undefined>(undefined);

  const pinnedComment = useMemo(
    () => comments.find((it) => it.id === pinnedId),
    [pinnedId, comments]
  );

  const windowSize = useWindowSize();

  const controls = useReactive({
    show: false,
    volume: 1,
    muted: false,
    mini: false,
    fullscreen: false,
    theatre: false,
    speed: 1,
    sinceMouseMoved: Date.now(),
  });

  const dimensions: IPlayerContext['dimensions'] = useMemo(() => {
    if (!videoElement) return { height: 0, width: 0 };

    const { height, width } = videoElement.getBoundingClientRect();

    return { height, width };
  }, [container, windowSize, { ...controls }]);

  const storedSegmentsTime = useMemo(() => {
    return watchSegments.reduce((time, segment) => {
      return time + (segment.to - segment.from);
    }, 0);
  }, watchSegments);

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

  /**
    ███╗   ███╗███████╗████████╗██╗  ██╗ ██████╗ ██████╗ ███████╗
    ████╗ ████║██╔════╝╚══██╔══╝██║  ██║██╔═══██╗██╔══██╗██╔════╝
    ██╔████╔██║█████╗     ██║   ███████║██║   ██║██║  ██║███████╗
    ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║██║   ██║██║  ██║╚════██║
    ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██████╔╝███████║
    ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝                                                         
   */

  const likeComment: IPlayerContext['likeComment'] = async (commentId) => {
    if (!isAuthenticated) return;

    try {
      await useApi.post(`/videos/${id}/comments/${commentId}/like`);

      // update comments
      setComments(
        comments.map((it) => {
          if (it.id !== commentId) return it;

          // remove if dislike
          if (it.isDisliked) {
            it.dislikeCount = it.dislikeCount - 1;
            it.isDisliked = false;
          }

          return { ...it, likeCount: it.likeCount + 1, isLiked: true };
        })
      );
    } catch (error) {
      showToast({ component: 'Unable to like comment', duration: 2000, type: 'danger' });
    }
  };

  const unlikeComment: IPlayerContext['unlikeComment'] = async (commentId) => {
    if (!isAuthenticated) return;
    try {
      await useApi.delete(`/videos/${id}/comments/${commentId}/like`);

      // update comments
      setComments(
        comments.map((it) => {
          if (it.id !== commentId) return it;

          return { ...it, likeCount: it.likeCount - 1, isLiked: false };
        })
      );
    } catch (error) {
      showToast({ component: 'Unable to unlike comment', duration: 2000, type: 'danger' });
    }
  };

  const dislikeComment: IPlayerContext['dislikeComment'] = async (commentId) => {
    if (!isAuthenticated) return;
    try {
      await useApi.post(`/videos/${id}/comments/${commentId}/dislike`);

      // update comments
      setComments(
        comments.map((it) => {
          if (it.id !== commentId) return it;

          // remove if dislike
          if (it.isLiked) {
            it.likeCount = it.likeCount - 1;
            it.isLiked = false;
          }

          return { ...it, dislikeCount: it.dislikeCount + 1, isDisliked: true };
        })
      );
    } catch (error) {
      showToast({ component: 'Unable to dislike comment', duration: 2000, type: 'danger' });
    }
  };

  const unDislikeComment: IPlayerContext['unDislikeComment'] = async (commentId) => {
    if (!isAuthenticated) return;
    try {
      await useApi.delete(`/videos/${id}/comments/${commentId}/dislike`);

      // update comments
      setComments(
        comments.map((it) => {
          if (it.id !== commentId) return it;

          return { ...it, dislikeCount: it.dislikeCount - 1, isDisliked: false };
        })
      );
    } catch (error) {
      showToast({ component: 'Unable to undislike comment', duration: 2000, type: 'danger' });
    }
  };

  const heartComment: IPlayerContext['heartComment'] = async (commentId) => {
    if (!isAuthenticated || data?.owner.id !== user?.id) return;

    try {
      await useApi.post(`/videos/${id}/comments/${commentId}/heart`);

      // update comments
      setComments(
        comments.map((it) => {
          if (it.id !== commentId) return it;

          return { ...it, isHearted: true };
        })
      );
    } catch (error) {
      showToast({ component: 'Unable to heart comment', duration: 2000, type: 'danger' });
    }
  };

  const unHeartComment: IPlayerContext['unHeartComment'] = async (commentId) => {
    if (!isAuthenticated || data?.owner.id !== user?.id) return;

    try {
      await useApi.delete(`/videos/${id}/comments/${commentId}/heart`);

      // update comments
      setComments(
        comments.map((it) => {
          if (it.id !== commentId) return it;

          return { ...it, isHearted: false };
        })
      );
    } catch (error) {
      showToast({ component: 'Unable to unheart comment', duration: 2000, type: 'danger' });
    }
  };

  const pinComment: IPlayerContext['pinComment'] = async (commentId) => {
    if (!isAuthenticated) return;

    try {
      const res = await useApi.post<ApiResponse<VideoComment>>(
        `/videos/${id}/comments/${commentId}/pin`
      );

      const pinned = res.data.data;

      if (pinned) {
        setPinnedId(commentId);
      }
    } catch (error) {}
  };

  const unpinComment: IPlayerContext['unpinComment'] = async (commentId) => {
    if (!isAuthenticated) return;

    try {
      await useApi.delete(`/videos/${id}/comments/${commentId}/pin`);

      setPinnedId(undefined);
    } catch (error) {}
  };

  const deleteComment = async (commentId: number) => {
    if (!isAuthenticated) return;

    try {
      await useApi.delete(`/videos/${id}/comments/${commentId}`);

      setComments(comments.filter((it) => it.id !== commentId));
    } catch (error) {
      showToast({ component: 'Something went wrong', duration: 1500, type: 'danger' });
    }
  };

  const editComment = async (commentId: number, body: UpdateVideoCommentBody) => {
    if (!isAuthenticated) return;

    try {
      const res = await useApi.put<UpdateVideoCommentResponse>(
        `/videos/${id}/comments/${commentId}`,
        body
      );

      const updated = res.data.data;

      if (updated) {
        const n = comments.map((it) => (it.id === commentId ? { ...it, text: updated.text } : it));

        setComments(n);
      }
    } catch (e) {
      showToast({ component: 'Something went wrong', duration: 1500, type: 'danger' });
    }
  };

  const addComment = async (body: CreateVideoCommentBody) => {
    if (!isAuthenticated) return;

    try {
      const res = await useApi.post<CreateVideoCommentResponse>(`videos/${id}/comments`, body);

      const comment = res.data.data;

      if (comment) {
        setComments([comment, ...comments]);
      }
    } catch (error) {
      showToast({ component: 'Something went wrong', duration: 1500, type: 'danger' });
    }
  };

  const reset = () => {
    setData(undefined);
    setTimeRanges([]);
    setLoadingState('loading');
    setCurrentTime(0);
    setPreviousTime(0);
    setWatchTime(0);
    setViewCounted(false);
  };

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

    const newCurrentTime = videoElement.currentTime;

    const watchSegment = watchTime + (newCurrentTime - currentTime);

    setWatchSegments([...watchSegments, { from: currentTime, to: newCurrentTime }]);

    setWatchTime(watchSegment);
    setPreviousTime(currentTime);
    setCurrentTime(newCurrentTime);
  };

  const seekTime: IPlayerContext['seekTime'] = (e) => {
    if (!videoElement) return;

    const target = e.currentTarget;

    const { left, right } = target.getBoundingClientRect();

    const x = e.clientX;

    const percentage = (x - left) / (right - left);

    const newTime = percentage * duration;

    setWatchSegments([...watchSegments, { from: previousTime, to: currentTime }]);

    setPreviousTime(newTime);
    setCurrentTime(newTime);
    setWatchTime(watchTime + (currentTime - previousTime));

    videoElement.currentTime = newTime;
  };

  const onPause: IPlayerContext['onPause'] = () => {
    if (!videoElement) return;

    const newTime = videoElement.currentTime;

    setWatchSegments([...watchSegments, { from: previousTime, to: newTime }]);

    setWatchTime(watchTime + (newTime - previousTime));
    setPreviousTime(newTime);
    setCurrentTime(newTime);
  };

  const onEnded: IPlayerContext['onEnded'] = () => {
    if (!videoElement) return;

    const newTime = videoElement.currentTime;

    setWatchSegments([...watchSegments, { from: previousTime, to: newTime }]);

    setWatchTime(watchTime + (newTime - previousTime));
    setPreviousTime(0);
    setCurrentTime(0);
  };

  const toggleMiniPlayer: IPlayerContext['toggleMiniPlayer'] = () => {
    if (!videoElement) return;

    // controls.mini = typeof v === 'boolean' ? v : !controls.mini;
  };

  const toggleVideoRating = (isLike: boolean, rate: boolean) => {
    const method = rate ? 'post' : 'delete';
    const url = `/videos/${id}/${isLike ? 'like' : 'dislike'}`;

    useApi[method]<ApiResponse<Video>>(url).then((res) => {
      if (res.data.data) {
        setData(res.data.data);
      }
    });
  };

  const toggleVideoLike: IPlayerContext['toggleVideoLike'] = () => {
    if (!id || !data) {
      return;
    }

    if (!isAuthenticated) {
      alert('cannot perform action while signed out !');
      return;
    }

    const action = !data.isLiked;

    toggleVideoRating(true, action);
  };

  const toggleVideoDislike: IPlayerContext['toggleVideoDislike'] = () => {
    if (!id || !data) {
      return;
    }

    if (!isAuthenticated) {
      alert('cannot perform action while signed out !');
      return;
    }

    const action = !data.isDisliked;

    toggleVideoRating(false, action);
  };

  /**
    ███████╗███████╗███████╗███████╗ ██████╗████████╗███████╗
    ██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝╚══██╔══╝██╔════╝
    █████╗  █████╗  █████╗  █████╗  ██║        ██║   ███████╗
    ██╔══╝  ██╔══╝  ██╔══╝  ██╔══╝  ██║        ██║   ╚════██║
    ███████╗██║     ██║     ███████╗╚██████╗   ██║   ███████║
    ╚══════╝╚═╝     ╚═╝     ╚══════╝ ╚═════╝   ╚═╝   ╚══════╝                                                    
   */

  useEffect(() => {
    const miniEl = document.querySelector<HTMLElement>(`#${miniPlayerId}`);
    setTimeout(() => {
      const videoEl = document.querySelector<HTMLVideoElement>(`#${videoElementId}`);
      if (videoEl) {
        setVideoElement(videoEl);
      }
    }, 500);

    if (miniEl) {
      setContainer(miniEl);
    }
  });

  useEffect(() => {
    if (!container) setId(undefined);
  }, container);

  useEffect(() => {
    if (id === undefined) {
      reset();

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

  useEffect(() => {
    if (!id || storedSegmentsTime < 1) {
      return;
    }

    const segments = [...watchSegments].filter((it) => it.from < it.to);
    setWatchSegments([]);

    // we send data to the server
    useApi.post(`/videos/${id}/watch`, segments);
  }, storedSegmentsTime);

  useEffect(() => {
    if (!id || !data || watchTime < data.minViewDuration || isViewCounted) return;

    setViewCounted(true);

    useApi.post(`/videos/${id}/view`);
  }, [watchTime, isViewCounted]);

  // get video comments
  useEffect(() => {
    if (!id) return;

    useApi.get<GetVideoCommentResponse>(`videos/${id}/comments?from=0&count=10`).then((it) => {
      if (it.data.data) {
        setComments(it.data.data);
      }

      if (it.data.pinned) {
        setPinnedId(it.data.pinned);
      }
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
        toggleVideoDislike,
        toggleVideoLike,
        onPause,
        onEnded,
        dimensions,
        editComment,
        deleteComment,
        addComment,
        comments,
        pinnedComment,
        pinComment,
        unpinComment,
        setVideoElement,

        likeComment,
        unlikeComment,
        dislikeComment,
        unDislikeComment,
        heartComment,
        unHeartComment,
      }}
    >
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
