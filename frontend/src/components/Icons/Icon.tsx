import { joinClasses } from '@riadh-adrani/ruvy';
import BellIcon from './Bell.icon';
import BurgerIcon from './Burger.icon';
import Check from './Check';
import CreateIcon from './Create.icon';
import CreatePostIcon from './CreatePost.icon';
import Logo from './Logo';
import MicrophoneIcon from './Microphone.icon';
import SearchIcon from './Search.icon';
import UploadVideoIcon from './UploadVideo.icon';
import UserIcon from './User.icon';
import SettingsIcon from './Settings.icon';
import StudioIcon from './Studio.icon';
import SignoutIcon from './Signout.icon';
import ThumbUp from './ThumbUp';
import ThumbDown from './ThumbDown';

export interface SVGIconProps extends HTMLElementProps<HTMLDivElement> {
  icon: IconName;
}

const IconsList = {
  bell: <BellIcon />,
  burger: <BurgerIcon />,
  check: <Check />,
  create: <CreateIcon />,
  write: <CreatePostIcon />,
  logo: <Logo />,
  microphone: <MicrophoneIcon />,
  search: <SearchIcon />,
  upload: <UploadVideoIcon />,
  user: <UserIcon />,
  settings: <SettingsIcon />,
  studio: <StudioIcon />,
  signout: <SignoutIcon />,
  'thumb-up': <ThumbUp />,
  'thumb-down': <ThumbDown />,
};

export type IconName = keyof typeof IconsList;

export default (props: SVGIconProps) => {
  return (
    <div {...props} if class={joinClasses('col-center w-25px h-25px', props.class)}>
      {IconsList[props.icon]}
    </div>
  );
};
