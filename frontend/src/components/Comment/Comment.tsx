import {
  Fragment,
  PropsWithUtility,
  useContext,
  useEffect,
  useMemo,
  useReactive,
  useState,
} from '@riadh-adrani/ruvy';
import { VideoComment } from '../../types/video';
import { UserContext } from '../../context/User.context';
import { PlayerContext } from '../../context/Player.context';
import GButton from '../Button/G.Button';
import CommentActionButton from './Comment.Action.Button';
import CommentReplies from './Comment.Replies';

export interface CommentProps extends PropsWithUtility {
  comment: VideoComment;
  isPinned?: boolean;
}

export default (props: CommentProps) => {
  const { isAuthenticated, user } = useContext(UserContext);
  const {
    deleteComment,
    editComment,
    data,
    pinComment,
    unpinComment,
    likeComment,
    unlikeComment,
    dislikeComment,
    heartComment,
    unDislikeComment,
    unHeartComment,
  } = useContext(PlayerContext);

  const [showActions, setShowActions] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const comment = props.comment;

  const edit = useReactive({ text: comment.text, is: false, loading: false });

  const ratingActions = [
    {
      icon: comment.isLiked ? 'i-mdi-thumb-up text-green-600' : 'i-mdi-light-thumb-up',
      onClick: () => (comment.isLiked ? unlikeComment(comment.id) : likeComment(comment.id)),
      tooltip: 'Like',
      count: comment.likeCount > 0 ? comment.likeCount : undefined,
    },
    {
      icon: comment.isDisliked ? 'i-mdi-thumb-down text-green-600' : 'i-mdi-light-thumb-down',
      onClick: () =>
        comment.isDisliked ? unDislikeComment(comment.id) : dislikeComment(comment.id),
      tooltip: 'Like',
      count: comment.dislikeCount > 0 ? comment.dislikeCount : undefined,
    },
    {
      icon: comment.isHearted ? 'i-mdi-heart text-red-600' : 'i-mdi-light-heart',
      onClick: () => (comment.isHearted ? unHeartComment(comment.id) : heartComment(comment.id)),
      tooltip: comment.isHearted
        ? `Hearted by ${data?.owner.firstName} ${data?.owner.lastName}`
        : '',
    },
    {
      icon: 'i-mdi-reply',
      onClick: () => setShowReplies(!showReplies),
      tooltip: 'Reply',
      count: comment.replyCount > 0 ? comment.replyCount : undefined,
    },
  ];

  const editActions = useMemo(() => {
    if (!isAuthenticated || user?.id !== comment.userId) {
      return [];
    }

    const items = [
      {
        icon: 'i-mdi-light-pencil',
        onClick: () => (edit.is = true),
        tooltip: 'Edit',
      },
      {
        icon: 'i-mdi-light-delete',
        onClick: () => deleteComment(comment.id),
        tooltip: 'Delete',
      },
    ];

    return items;
  }, [props.comment, isAuthenticated, user, data]);

  const ownerActions = useMemo(() => {
    if (!isAuthenticated || !user) {
      return [];
    }

    const items = [];

    if (user.id === data?.owner.id) {
      if (!props.isPinned) {
        items.push({
          icon: 'i-mdi-light-pin',
          onClick: () => pinComment(comment.id),
          tooltip: 'Pin',
        });
      } else {
        items.push({
          icon: 'i-mdi-light-pin-off',
          onClick: () => unpinComment(comment.id),
          tooltip: 'Unpin',
        });
      }
    }

    return items;
  }, [props.comment, isAuthenticated, user, data, props.isPinned]);

  useEffect(() => {
    edit.text = comment.text;
  }, [comment.text]);

  const confirmEdit = async () => {
    try {
      await editComment(comment.id, { text: edit.text });
    } catch (error) {
    } finally {
      edit.loading = false;
      edit.is = false;
    }
  };

  return (
    <div
      class={[
        'row gap-5 p-2 bg-zinc-800 rounded',
        props.isPinned && 'border-solid border-1px  border-zinc-600',
      ]}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <img
        src="https://yt3.googleusercontent.com/ytc/AOPolaQ2iMmw9cWFFjnwa13nBwtZQbl-AqGYkkiTqNaTLg=s176-c-k-c0x00ffffff-no-rj-mo"
        class="h-30px w-30px rounded-50%"
      />
      <div class="col items-start gap-1 flex-1">
        <div class="row-center h-30px gap-2">
          <span class="text-zinc-400 text-[0.85em]">
            {comment.user.firstName} {comment.user.lastName}
          </span>
          <span class="text-zinc-400 text-[0.75em]">
            {new Date(comment.createdAt).toDateString()}
          </span>
        </div>
        <div class="col w-full">
          <div if={edit.is} class="col gap-2 w-full">
            <textarea
              disabled={edit.loading}
              value={edit.text}
              rows={2}
              autofocus
              onInput={(e) => (edit.text = e.currentTarget.value)}
              class={[
                'p-2 text-1em font-inherit bg-transparent border-none',
                'bg-zinc-900 rounded',
                'border-b-transparent border-b-solid border-b-1px focus:border-b-white',
                'focus:outline-none',
                'resize-y',
              ]}
            />
            <div class="row justify-end gap-2">
              <GButton
                disabled={edit.loading}
                class="bg-zinc-900"
                onClick={() => (edit.is = false)}
              >
                Cancel
              </GButton>
              <GButton disabled={edit.loading} class="bg-green-700" onClick={confirmEdit}>
                Confirm
              </GButton>
            </div>
          </div>
          <Fragment else>
            <div>{comment.text}</div>
            <div class="row items-center gap-5 m-y-1.5">
              <div class="row items-center gap-1">
                {ratingActions.map((it) => (
                  <CommentActionButton
                    key={it.icon}
                    icon={it.icon}
                    onClick={it.onClick}
                    tooltip={it.tooltip}
                    count={it.count}
                  />
                ))}
              </div>
              <div class="row items-center gap-1">
                {editActions.map((it) => (
                  <CommentActionButton
                    key={it.icon}
                    icon={it.icon}
                    tooltip={it.tooltip}
                    onClick={it.onClick}
                    classes={[showActions ? 'opacity-100' : 'opacity-0']}
                  />
                ))}
              </div>
              <div class="row items-center gap-1">
                {ownerActions.map((it) => (
                  <CommentActionButton
                    key={it.icon}
                    icon={it.icon}
                    tooltip={it.tooltip}
                    onClick={it.onClick}
                    classes={[showActions ? 'opacity-100' : 'opacity-0']}
                  />
                ))}
              </div>
            </div>
          </Fragment>
          <CommentReplies if={showReplies} comment={comment} />
        </div>
      </div>
    </div>
  );
};
