import { segmentize } from '@riadh-adrani/utils';

export function getChunkFromFile(file: File, from: number, to: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = (ev) => {
      reject(ev);
    };

    reader.onload = function () {
      const chunk = reader.result;

      if (chunk instanceof ArrayBuffer) {
        const arrayOfBytes = new Uint8Array(chunk);

        const segments = segmentize(Array.from(arrayOfBytes), 1024 * 24);

        const bytes = segments
          .map((it, index) => {
            let base64 = btoa(String.fromCharCode(...it));

            // remove padding
            if (index != segments.length - 1) {
              while (base64.endsWith('=')) {
                const length = base64.length;

                base64 = base64.slice(0, length - 1);
              }
            }

            return base64;
          })
          .join('');

        resolve(bytes);
      } else {
        reject('failed to process file');
      }
    };

    function readChunk() {
      const blob = file.slice(from, to);

      reader.readAsArrayBuffer(blob);
    }

    readChunk();
  });
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise(async (resolve, reject) => {
    const videoElement = document.createElement('video');

    videoElement.src = URL.createObjectURL(file);
    videoElement.muted = true;

    try {
      await videoElement.play();
    } catch (error) {
      reject('not valid video');
    }

    videoElement.pause();

    resolve(videoElement.duration);

    URL.revokeObjectURL(videoElement.src);
  });
}
