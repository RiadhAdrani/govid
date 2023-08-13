import { PropsWithUtility, useEffect, useMemo } from '@riadh-adrani/ruvy';
import { UploadTask } from '../../types/video';
import { GiantIcon } from '../Icon/Icon';

export type UploadProgressProps = PropsWithUtility<{
  task: UploadTask;
}>;

export default ({ task }: UploadProgressProps) => {
  const progress = useMemo(() => {
    return Math.ceil((task.uploaded / task.size) * 100);
  }, task);

  const url = useMemo(() => `/watch?v=${task.videoId}`);

  useEffect(() => {
    document.title =
      task.status === 'processing' ? 'Video is processing...' : `Uploading Video : ${progress}%`;
  }, task);

  return (
    <div switch={task.status}>
      <div case="uploading" class={'col-center gap-5'}>
        <GiantIcon icon="i-mdi-progress-download" class="animate-pulse" />
        <h2>Uploading video</h2>
        <p>Do not close this tab until the video is done uploading.</p>
        <p>
          Your video will be available here :
          <a href={url} target={'_blank'} onClick:stop>
            {url}
          </a>
        </p>
        <div class="relative row-center p-y-1 w-100% bg-zinc-800 rounded overflow-hidden">
          <div
            class="absolute left-0px top-0px bottom-0px bg-green-500 duration-100"
            style={{ width: `${progress}%` }}
          />
          <span class="z-1">{progress}% done</span>
        </div>
      </div>
      <div case="processing" class={'col-center gap-5'}>
        <GiantIcon icon="i-mdi-rhombus-split" class="animate-pulse" />
        <h2>Upload completed</h2>
        <p>Video upload completed, you may close this tab safely.</p>
        <p>
          Your video will be available here :
          <a href={url} target={'_blank'} onClick:stop>
            {url}
          </a>
        </p>
      </div>
    </div>
  );
};
