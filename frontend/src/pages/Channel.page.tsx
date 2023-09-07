import {
  Fragment,
  PropsWithUtility,
  getParams,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReactive,
  useState,
} from '@riadh-adrani/ruvy';
import useApi from '../utils/api';
import { ApiResponse } from '../types/api';
import { PublicUser } from '../types/user';
import GButton from '../components/Button/G.Button';
import GoogleSpinner from '../components/Spinner/Google.spinner';
import { UserContext } from '../context/User.context';
import ChannelVideos from '../components/Channel/Channel.Videos';

export interface Tab {
  name: string;
  id: string;
  Component: (props: PropsWithUtility<{ user: PublicUser }>) => JSX.Element;
}

export default () => {
  const { user: currentUser } = useContext(UserContext);

  const user = useReactive<{ data: PublicUser | undefined; loading: 'loading' | 'done' | 'error' }>(
    { data: undefined, loading: 'loading' }
  );

  // get user data
  const { id } = getParams();

  const tabs: Array<Tab> = useMemo(() => {
    return [
      { name: 'Videos', id: 'video', Component: ChannelVideos },
      { name: 'Playlists', id: 'playlists', Component: ChannelVideos },
      { name: 'Subscriptions', id: 'subscriptions', Component: ChannelVideos },
      { name: 'About', id: 'about', Component: ChannelVideos },
    ];
  }, user.data);

  const [tab, setTab] = useState(tabs[0].id);

  const Component = useMemo(() => tabs.find((it) => it.id === tab)?.Component!);

  const onSubscribe = useCallback(() => {
    if (!user.data) return;

    const id = user.data.id;

    const subscribed = user.data.subscribed;

    useApi[subscribed ? 'delete' : 'post'](`/users/${id}/subscribe`).then(() => {
      if (!user.data) return;

      if (subscribed) {
        user.data.subscribed = false;
        user.data.subCount--;
      } else {
        user.data.subscribed = true;
        user.data.subCount++;
      }
    });
  }, user.data);

  // retrieve user
  useEffect(() => {
    useApi
      .get<ApiResponse<PublicUser>>(`/users/${id}`)
      .then((it) => {
        const userData = it.data.data;

        if (userData) {
          user.data = userData;
          user.loading = 'done';
        } else {
          user.loading = 'error';
        }
      })
      .catch(() => (user.loading = 'error'));
  }, id);

  return (
    <>
      <Fragment switch={user.loading}>
        <div case={'loading'} class="col-center gap-2 w-full h-full">
          <GoogleSpinner />
          <h3>Loading user channel...</h3>
        </div>
        <div case="done" class="col flex-1 p-b-5">
          <div
            class="w-full h-300px bg-center rounded"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1693253024090-1fc1e1821a5c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1931&q=80')",
            }}
          />
          <div>
            <img
              src="https://yt3.googleusercontent.com/ytc/AOPolaQ2iMmw9cWFFjnwa13nBwtZQbl-AqGYkkiTqNaTLg=s176-c-k-c0x00ffffff-no-rj-mo"
              class="h-100px w-100px rounded-50% p-2 bg-zinc-900 -m-t-50px"
            />
            <h3>
              {user.data?.firstName} {user.data?.lastName}
            </h3>
            <h4 class="text-zinc-400">
              {user.data?.subCount} subscriber{user.data && user.data?.subCount > 1 ? 's' : ''}
            </h4>
            <GButton
              if={user.data?.id !== currentUser?.id}
              onClick={onSubscribe}
              class={['m-t-3 p-x-5', user.data?.subscribed ? 'bg-zinc-600' : 'bg-green-600']}
            >
              {user.data?.subscribed ? 'Subscribed' : 'Subscribe'}
            </GButton>
          </div>
          <div class="row-center m-t-10">
            {tabs.map((it, key) => (
              <div
                key={key}
                class={[
                  'p-x-4 p-y-2 border-b-2px border-b-solid border-b-transparent cursor-pointer',
                  it.id === tab && 'border-b-zinc-300',
                ]}
                onClick={() => setTab(it.id)}
              >
                {it.name}
              </div>
            ))}
          </div>
          <div class="w-full rounded flex-1">
            <Component user={user.data!} />
          </div>
        </div>
      </Fragment>
    </>
  );
};
