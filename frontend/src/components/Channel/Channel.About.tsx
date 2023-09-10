import { PropsWithUtility } from '@riadh-adrani/ruvy';
import { PublicUser } from '../../types/user';
import Icon from '../Icon/Icon';

export default (props: PropsWithUtility<{ user: PublicUser }>) => {
  return (
    <div class="col-center flex-1 p-y-5 ">
      <div class="col-center border-solid border-1px border-zinc-700 rounded p-5 aspect-square gap-2">
        <Icon icon="i-mdi-user text-2em" />
        <h2>
          {props.user.firstName} {props.user.lastName}
        </h2>
        <p class="text-zinc-400">Joined {new Date(props.user.createdAt).toDateString()}</p>
        <p class="text-zinc-500">
          {props.user.subCount} subscriber{props.user.subCount > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
