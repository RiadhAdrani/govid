import {
  Fragment,
  PropsWithUtility,
  useContext,
  useEffect,
  useMemo,
  useReactive,
  useState,
} from '@riadh-adrani/ruvy';
import { Reply } from '../../types/video';
import { UserContext } from '../../context/User.context';
import GButton from '../Button/G.Button';
import CommentActionButton from './Comment.Action.Button';
import { PlayerContext } from '../../context/Player.context';

export interface ReplyProps extends PropsWithUtility {
  reply: Reply;
  onLike: () => void;
  onUnLike: () => void;
  onDislike: () => void;
  onUnDislike: () => void;
  onHeart: () => void;
  onUnheart: () => void;
  onEditConfirm: (text: string) => Promise<void>;
  onDelete: () => void;
}

export default (props: ReplyProps) => {
  const { isAuthenticated, user } = useContext(UserContext);
  const { data } = useContext(PlayerContext);

  const [showActions, setShowActions] = useState(false);

  const {
    reply,
    onDelete,
    onDislike,
    onEditConfirm,
    onHeart,
    onLike,
    onUnDislike,
    onUnLike,
    onUnheart,
  } = props;

  const edit = useReactive({ text: reply.text, is: false, loading: false });

  const ratingActions = [
    {
      icon: reply.isLiked ? 'i-mdi-thumb-up text-green-600' : 'i-mdi-light-thumb-up',
      onClick: () => (reply.isLiked ? onUnLike() : onLike()),
      tooltip: 'Like',
      count: reply.likeCount > 0 ? reply.likeCount : undefined,
    },
    {
      icon: reply.isDisliked ? 'i-mdi-thumb-down text-green-600' : 'i-mdi-light-thumb-down',
      onClick: () => (reply.isDisliked ? onUnDislike() : onDislike()),
      tooltip: 'Like',
      count: reply.dislikeCount > 0 ? reply.dislikeCount : undefined,
    },
    {
      icon: reply.isHearted ? 'i-mdi-heart text-red-600' : 'i-mdi-light-heart',
      onClick: () => (reply.isHearted ? onUnheart() : onHeart()),
      tooltip: reply.isHearted ? `Hearted by ${data?.owner.firstName} ${data?.owner.lastName}` : '',
    },
  ];

  const editActions = useMemo(() => {
    if (!isAuthenticated || user?.id !== reply.userId) {
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
        onClick: () => onDelete(),
        tooltip: 'Delete',
      },
    ];

    return items;
  }, [props.reply, isAuthenticated, user, data]);

  useEffect(() => {
    edit.text = reply.text;
  }, [reply.text]);

  const confirmEdit = async () => {
    try {
      await onEditConfirm(edit.text);
    } catch (error) {
    } finally {
      edit.loading = false;
      edit.is = false;
    }
  };

  return (
    <div
      class={['row gap-5 p-2 bg-zinc-800 rounded']}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <img
        src="https://yt3.googleusercontent.com/ytc/AOPolaQ2iMmw9cWFFjnwa13nBwtZQbl-AqGYkkiTqNaTLg=s176-c-k-c0x00ffffff-no-rj-mo"
        class="h-20px w-20px rounded-50%"
      />
      <div class="col items-start gap-1 flex-1">
        <div class="row-center h-20px gap-2">
          <span class="text-zinc-400 text-[0.8em]">
            {reply.user.firstName} {reply.user.lastName}
          </span>
          <span class="text-zinc-400 text-[0.7em]">{new Date(reply.createdAt).toDateString()}</span>
        </div>
        <div class="col w-full">
          <div if={edit.is} class="col gap-2 w-full">
            <textarea
              disabled={edit.loading}
              value={edit.text}
              placeholder="Edit reply..."
              rows={2}
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
            <div class="text-[0.9em]">{reply.text}</div>
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
            </div>
          </Fragment>
        </div>
      </div>
    </div>
  );
};
