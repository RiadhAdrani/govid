import { PropsWithUtility, joinClasses } from '@riadh-adrani/ruvy';
import { Arrayable } from '@riadh-adrani/utils';
import Icon from '../Icon/Icon';

export default (
  props: PropsWithUtility<{
    icon: string;
    onClick: () => void;
    classes?: Arrayable<string>;
    count?: number;
    tooltip: string;
  }>
) => {
  return (
    <div
      title={props.tooltip}
      class={joinClasses(
        ['row-center cursor-pointer hover:bg-zinc-700 rounded gap-2 p-1.5', ,],
        props.classes
      )}
      onClick={props.onClick}
    >
      <Icon icon={props.icon} />
      <span if={props.count !== undefined} class="text-[0.8em]">
        {props.count}
      </span>
    </div>
  );
};
