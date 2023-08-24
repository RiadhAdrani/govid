import { PropsWithUtility, useContext, useMemo } from '@riadh-adrani/ruvy';
import { VideoComment } from '../../types/video';
import Icon from '../Icon/Icon';
import { UserContext } from '../../context/User.context';
import useApi from '../../utils/api';

export interface CommentProps extends PropsWithUtility {
  comment: VideoComment;
}

export default (props: CommentProps) => {
  const { isAuthenticated, user } = useContext(UserContext);

  const comment = props.comment;

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
          onClick: () => {},
        },
        {
          icon: 'i-mdi-light-delete',
          onClick: () => {
            useApi.delete(`/videos/${comment.videoId}/comments/${comment.id}`);
          },
        }
      );
    }

    return items;
  }, [props.comment, isAuthenticated, user]);

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
        <div>{comment.text}</div>
        <div class="row items-center gap-1.5 m-y-1.5">
          {actions.map((it) => (
            <div
              key={it.icon}
              class={'col-center cursor-pointer hover:bg-zinc-700 rounded-full p-1.5 aspect-square'}
              onClick={it.onClick}
            >
              <Icon icon={it.icon} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
