import { PropsWithUtility } from '@riadh-adrani/ruvy';
import GoogleSpinner from '../Spinner/Google.spinner';

export default (_: PropsWithUtility) => {
  return (
    <div class="absolute inset-0px col-center">
      <GoogleSpinner />
    </div>
  );
};
