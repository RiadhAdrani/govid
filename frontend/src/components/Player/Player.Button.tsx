import { useContext } from '@riadh-adrani/ruvy';
import Icon from '../Icon/Icon';
import { PlayerContext } from '../../context/Player.context';

export interface PlayerButtonProps extends HTMLElementProps<HTMLDivElement, object> {
  icon: string;
}

export default (props: PlayerButtonProps) => {
  const { mini } = useContext(PlayerContext);

  return (
    <div {...props} class={mini ? 'player-btn-mini' : 'player-btn-page'}>
      <Icon icon={props.icon} />
    </div>
  );
};
