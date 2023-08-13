import { useContext, useReactive, useState } from '@riadh-adrani/ruvy';
import useApi from '../utils/api';
import { getChunkFromFile, getVideoDuration } from '../utils/video';
import {
  UploadBody,
  UploadChunkBody,
  UploadChunkResponse,
  UploadProgressResponse,
  UploadTask,
} from '../types/video';
import UploadSelect from '../components/Upload/Upload.Select';
import UploadProgress from '../components/Upload/Upload.Progress';
import { UIContext } from '../context/UI.context';
import UploadCompleted from '../components/Upload/Upload.Completed';

export default () => {
  const { showToast } = useContext(UIContext);

  const [state, setState] = useState<'select' | 'upload' | 'done' | 'error'>('select');
  const [task, setTask, getTask] = useState<UploadTask | undefined>(undefined);

  const failCount = useReactive({ value: 0 });

  const checkProcessLoop = async () => {
    const task = getTask();

    if (!task) {
      return;
    }

    const res = await useApi.get<UploadProgressResponse>(`/videos/${task.videoId}/upload/progress`);

    const { data, error } = res.data;

    if (error) {
      failCount.value++;

      if (failCount.value > 5) {
        showToast({
          component: 'Unable to retrieve progress data...',
          duration: 5000,
          type: 'danger',
        });
      } else {
        showToast({
          component:
            'Something went wrong when trying to get video progress, retrying in 5 seconds...',
          duration: 5000,
          type: 'warning',
        });
      }
    }

    if (data) {
      setTask(data);

      if (data.status === 'done') {
        setState('done');
      }
    }

    setTimeout(() => {
      if (getTask()?.status === 'processing') {
        checkProcessLoop();
      }
    }, 5000);
  };

  const uploadChunkLoop = async (videoId: number, file: File, body: UploadChunkBody) => {
    const res = await useApi.post<UploadChunkResponse>(`/videos/${videoId}/upload`, body);

    if (!res?.data) {
      setState('error');
      return;
    }

    setTask(res.data.data);

    if (!res.data.next) {
      showToast({
        type: 'success',
        component: 'Video upload completed and is now processing',
        duration: 3000,
      });

      checkProcessLoop();

      return;
    }

    const { from, to, taskId } = res.data.next;

    let bytes: string | undefined;

    try {
      bytes = await getChunkFromFile(file, from, to);
    } catch (e) {}

    if (!bytes) {
      setState('error');
      return;
    }

    const chunkBody: UploadChunkBody = { from, to, taskId, bytes };

    uploadChunkLoop(videoId, file, chunkBody);
  };

  const onFileSelected = async (file: File) => {
    // send request to api and start the loop
    const { name, size } = file;

    const duration = await getVideoDuration(file);

    const body: UploadBody = { duration, filename: name, size, title: name };

    const res = await useApi.post<UploadChunkResponse>(`/videos`, body);

    if (!res?.data) {
      setState('error');
      return;
    }

    setTask(res.data.data);

    if (!res.data.next) {
      // we need to start sending request to check if video processing is done or not

      return;
    }

    setState('upload');

    const videoId = res.data.data.videoId;

    const { from, to, taskId } = res.data.next;

    let bytes: string | undefined;

    try {
      bytes = await getChunkFromFile(file, from, to);
    } catch (e) {}

    if (!bytes) {
      setState('error');
      return;
    }

    const chunkBody: UploadChunkBody = { from, to, taskId, bytes };

    uploadChunkLoop(videoId, file, chunkBody);
  };

  return (
    <div switch={state} class="col-center gap-5 flex-1 m-5 rounded-10px">
      <UploadSelect case={'select'} onSelected={onFileSelected} />
      <UploadProgress case={'upload'} task={task!} />
      <UploadCompleted case={'done'} task={task!} />
    </div>
  );
};
