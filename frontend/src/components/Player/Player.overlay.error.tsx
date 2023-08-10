import { PropsWithUtility } from '@riadh-adrani/ruvy';

import Icon from '../Icon/Icon';

export default (_: PropsWithUtility) => {
  return (
    <div class="absolute inset-0px col-center gap-2">
      <Icon icon="i-mdi-alert-circle" class={'text-5em'} />
      <p>We were unable to fetch the video !</p>
    </div>
  );
};
