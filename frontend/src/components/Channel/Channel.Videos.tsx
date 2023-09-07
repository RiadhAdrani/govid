import { useEffect, useState } from '@riadh-adrani/ruvy';
import { PublicUser } from '../../types/user';
import { Video } from '../../types/video';
import useApi from '../../utils/api';
import { ApiResponse } from '../../types/api';

export interface ChannelVideosProps {
  user: PublicUser;
}

export default (props: ChannelVideosProps) => {
  const [videos, setVideos] = useState<Array<Video>>([]);

  useEffect(() => {
    useApi
      .get<ApiResponse<Array<Video>, { totalCount: number }>>(
        `/videos/user/${props.user.id}?from=0&count=10`
      )
      .then((it) => {
        const data = it.data.data;

        if (data) {
          setVideos((v) => [...v, ...data]);
        }
      });
  });

  return (
    <div class="col-center flex-1 p-y-5">
      <div class="grid grid-cols-6 gap-5">
        {videos.map((video) => (
          <a class="col" href={`/watch?v=${video.id}`}>
            <div class="relative h-120px w-210px rounded">
              <img
                src="https://i.ytimg.com/an_webp/ugyXwQieSE4/mqdefault_6s.webp?du=3000&sqp=CIDO46cG&rs=AOn4CLCi0nHhD94rmAen0th9fzlO_E2wew"
                class="h-full w-full rounded"
              />
            </div>
            <div class="col text-start p-y-2">
              <span>{video.title}</span>
              <span class="text-zinc-500 text-[0.9em]">{video.views} views</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
