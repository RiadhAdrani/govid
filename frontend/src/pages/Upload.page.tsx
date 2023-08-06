import { useState } from '@riadh-adrani/ruvy';
import GButton from '../components/Button/G.Button';
import useApi from '../utils/api';

export default () => {
  const [form, setForm] = useState<{ file: File | undefined }>({ file: undefined });

  const uploadVideo = () => {
    if (!form.file) return;

    const body = new FormData();

    body.append('file', form.file);

    useApi
      .post(`/videos`, body, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((it) => {
        console.log(it);
      })
      .catch((e) => console.log(e));
  };

  return (
    <div class="col-center gap-5 flex-1 m-5 rounded-10px">
      <h2>Upload Video</h2>
      <div class="col-center gap-5">
        <input
          type={'file'}
          accept={'video/mp4'}
          onChange={(e) => {
            const file = e.currentTarget.files?.item(0);

            if (file) {
              setForm({ file });
            }
          }}
        />
        <div class="row justify-end gap-3">
          <GButton onClick={uploadVideo}>Save</GButton>
          <GButton>Cancel</GButton>
        </div>
      </div>
    </div>
  );
};
