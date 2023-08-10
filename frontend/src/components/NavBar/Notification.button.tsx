import Icon from '../Icon/Icon';
import NavBarButton from './NavBar.button';

export default () => {
  return (
    <NavBarButton
      icon="i-mdi-bell"
      menu={() => (
        <div class="col gap-1 w-400px h-600px overflow-hidden">
          <div class="row items-center justify-between p-x-4 p-y-3 border-b border-b-solid border-b-1px border-b-color-zinc-700">
            <span>Notifications</span>
            <Icon icon="i-mdi-cog" />
          </div>
          <div class="p-4 flex-1 col-center">
            <div class="col-center text-zinc-500">
              <Icon icon="i-mdi-bell" class="w-50px h-50px m-b-3" />
              <h3>Your notifications live here</h3>
              <p>Subscribe to your favorite channels to get notified about their latest videos.</p>
            </div>
          </div>
        </div>
      )}
    />
  );
};
