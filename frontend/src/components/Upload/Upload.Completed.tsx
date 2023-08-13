import { PropsWithUtility, useEffect, useMemo } from '@riadh-adrani/ruvy';
import { GiantIcon } from '../Icon/Icon';
import { UploadTask } from '../../types/video';

export type UploadCompletedProps = PropsWithUtility<{
  task: UploadTask;
}>;

export default ({ task }: UploadCompletedProps) => {
  const url = useMemo(() => `/watch?v=${task.videoId}`);

  useEffect(() => {
    document.title = 'Video uploaded successfully';
  });

  return (
    <>
      <div class="col-center gap-5">
        <GiantIcon icon="i-mdi-check" />
        <h2>Upload completed !</h2>
        <p>Your video is ready to be published</p>
        <p>
          Your video is available here :
          <a href={url} target={'_blank'} onClick:stop>
            {url}
          </a>
        </p>
      </div>
    </>
  );
};
