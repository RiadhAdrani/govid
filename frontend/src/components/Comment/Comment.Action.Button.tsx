import { PropsWithUtility, joinClasses } from '@riadh-adrani/ruvy';
import { Arrayable } from '@riadh-adrani/utils';
import Icon from '../Icon/Icon';

export default (
  props: PropsWithUtility<{
    icon: string;
    onClick: () => void;
    classes?: Arrayable<string>;
    tooltip: string;
  }>
) => {
  return (
    <div
      title={props.tooltip}
      class={joinClasses(
        ['col-center cursor-pointer hover:bg-zinc-700 rounded-full p-1.5 aspect-square', ,],
        props.classes
      )}
      onClick={props.onClick}
    >
      <Icon icon={props.icon} />
    </div>
  );
};
