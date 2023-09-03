import { PropsWithUtility, useEffect, useReactive, useState } from '@riadh-adrani/ruvy';
import { Reply, VideoComment } from '../../types/video';
import GoogleSpinner from '../Spinner/Google.spinner';
import useApi from '../../utils/api';
import { ApiResponse } from '../../types/api';
import CommentReply from './Comment.Reply';
import GButton from '../Button/G.Button';

export type CommentRepliesProps = PropsWithUtility<{
  comment: VideoComment;
}>;

export default (props: CommentRepliesProps) => {
  const { comment } = props;

  const [loading, setLoading] = useState(true);

  const [replies, setReplies] = useState<Array<Reply>>([]);

  const newReply = useReactive({ text: '', show: false });

  const addReply = () => {
    if (!newReply.text) return;

    const { text } = newReply;

    useApi
      .post<ApiResponse<Reply>>(`videos/${comment.videoId}/comments/${comment.id}/replies`, {
        text,
      })
      .then((it) => setReplies((replies) => [it.data.data!, ...replies]))
      .finally(() => (newReply.text = ''));
  };

  // fetch replies
  useEffect(() => {
    useApi
      .get<ApiResponse<Array<Reply>, { totalCount: number }>>(
        `videos/${comment.videoId}/comments/${comment.id}/replies?start=0&count=10`
      )
      .then((it) => setReplies(it.data.data!))
      .finally(() => setLoading(false));
  });

  return (
    <div class="col gap-2">
      <div class="col gap-2">
        <textarea
          value={newReply.text}
          rows={2}
          autofocus
          onInput={(e) => (newReply.text = e.currentTarget.value)}
          class={[
            'p-2 text-1em font-inherit bg-transparent border-none',
            'bg-zinc-900 rounded',
            'border-b-transparent border-b-solid border-b-1px focus:border-b-white',
            'focus:outline-none',
            'resize-y',
          ]}
        />
        <GButton class="bg-green-700 self-end" onClick={addReply}>
          Reply
        </GButton>
      </div>
      <div class="col gap-1">
        {replies.map((it) => (
          <CommentReply reply={it} />
        ))}
      </div>
      <div if={loading} class="self-center">
        <GoogleSpinner if={loading} />
      </div>
    </div>
  );
};
