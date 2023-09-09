import { useEffect, useState } from '@riadh-adrani/ruvy';
import { PublicUser } from '../../types/user';
import { Video } from '../../types/video';
import useApi from '../../utils/api';
import { ApiResponse } from '../../types/api';
import VideoGrid from '../Grid/Video.Grid';

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
      <VideoGrid videos={videos} />
    </div>
  );
};
