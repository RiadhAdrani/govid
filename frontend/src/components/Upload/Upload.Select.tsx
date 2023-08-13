import { PropsWithUtility, useState } from '@riadh-adrani/ruvy';
import { GiantIcon } from '../Icon/Icon';

export type UploadSelectProps = PropsWithUtility<{ onSelected: (file: File) => void }>;

export default ({ onSelected }: UploadSelectProps) => {
  const [error, setError] = useState<string | undefined>(undefined);

  const onFileSelected = () => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'video/*';
    input.multiple = false;

    input.onchange = () => {
      const file = input.files?.item(0);

      if (!file) return;

      if (!file.type.startsWith('video/')) {
        setError('Invalid file type');

        return;
      }

      onSelected(file);
    };

    input.click();
  };

  return (
    <>
      <h2>Upload Video</h2>
      <div class="col-center gap-5">
        <GiantIcon icon="i-mdi-upload" onClick={onFileSelected} />
        <div class="text-red" if={error != undefined}>
          {error}
        </div>
        <p>Select video file to start the upload</p>
        <p>Your video will be private until you publish them.</p>
      </div>
    </>
  );
};
