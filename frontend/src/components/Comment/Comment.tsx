import {
  Fragment,
  PropsWithUtility,
  useContext,
  useEffect,
  useMemo,
  useReactive,
} from '@riadh-adrani/ruvy';
import { VideoComment } from '../../types/video';
import Icon from '../Icon/Icon';
import { UserContext } from '../../context/User.context';
import { PlayerContext } from '../../context/Player.context';
import GButton from '../Button/G.Button';

export interface CommentProps extends PropsWithUtility {
  comment: VideoComment;
}

export default (props: CommentProps) => {
  const { isAuthenticated, user } = useContext(UserContext);
  const { deleteComment, editComment } = useContext(PlayerContext);

  const comment = props.comment;

  const edit = useReactive({ text: comment.text, is: false, loading: false });

  const actions = useMemo(() => {
    const items = [
      { icon: 'i-mdi-light-thumb-up', onClick: () => {} },
      { icon: 'i-mdi-light-thumb-down', onClick: () => {} },
      { icon: 'i-mdi-light-heart', onClick: () => {} },
      { icon: 'i-mdi-reply', onClick: () => {} },
    ];

    if (isAuthenticated && user?.id === comment.userId) {
      items.push(
        {
          icon: 'i-mdi-light-pencil',
          onClick: () => (edit.is = true),
        },
        {
          icon: 'i-mdi-light-delete',
          onClick: () => deleteComment(comment.id),
        }
      );
    }

    return items;
  }, [props.comment, isAuthenticated, user]);

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
    <div class="row gap-5 p-2 bg-zinc-800 rounded">
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
        <div if={edit.is} class="col gap-2 w-full">
          <textarea
            disabled={edit.loading}
            value={edit.text}
            rows={5}
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
            <GButton disabled={edit.loading} class="bg-zinc-900" onClick={() => (edit.is = false)}>
              Cancel
            </GButton>
            <GButton disabled={edit.loading} class="bg-green-700" onClick={confirmEdit}>
              Confirm
            </GButton>
          </div>
        </div>
        <Fragment else>
          <div>{comment.text}</div>
          <div class="row items-center gap-1.5 m-y-1.5">
            {actions.map((it) => (
              <div
                key={it.icon}
                class={
                  'col-center cursor-pointer hover:bg-zinc-700 rounded-full p-1.5 aspect-square'
                }
                onClick={it.onClick}
              >
                <Icon icon={it.icon} />
              </div>
            ))}
          </div>
        </Fragment>
      </div>
    </div>
  );
};
