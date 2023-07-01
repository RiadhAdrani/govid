import { DOMEvent, useContext, useReactive } from '@riadh-adrani/ruvy';
import { SigninBody } from '../types/user';
import { UserContext } from '../context/User.context';
import GButton from '../components/Button/G.Button';
import GInput from '../components/Button/G.Input';
import { UIContext } from '../context/UI.context';

export default () => {
  const { toggleLoader, showToast } = useContext(UIContext);
  const { signin } = useContext(UserContext);

  const form = useReactive<SigninBody>({
    email: '',
    password: '',
  });

  const updateFormField = (field: keyof SigninBody, e: DOMEvent<InputEvent, HTMLInputElement>) => {
    form[field] = e.currentTarget.value;
  };

  const onSignInClick = () => {
    toggleLoader(true);

    signin({ ...form })
      .then(() => {
        // if success, we redirect to signin
        // bruh
        showToast({ component: 'Signed in successfully', duration: 3000, type: 'success' });
      })
      .catch(() => {
        showToast({ component: 'Unable to Signin', duration: 3000, type: 'danger' });
      })
      .finally(() => {
        toggleLoader(false);
      });
  };

  return (
    <>
      <div class="relative col gap-8 border-[#2e2e2e] border-1px border-solid p-x-10 p-y-15 rounded-15px w-350px m-x-auto text-[1.1em]">
        <div class="col">
          <h4>Govid</h4>
          <h3 class="text-green">Sign in with your account</h3>
          <h5>Enter your info</h5>
        </div>
        <hr class="w-100%" size="1" color="#2e2e2e" />
        <form class="col gap-5">
          <GInput
            placeholder="Email"
            type="email"
            value={form.email}
            onInput={(e) => updateFormField('email', e)}
            autocomplete="email"
          />
          <GInput
            placeholder="Password"
            type="password"
            value={form.password}
            autocomplete="password"
            onInput={(e) => updateFormField('password', e)}
          />
        </form>
        <div class={'row justify-between items-center'}>
          <a href="/sign-up">Create account</a>
          <GButton onClick={onSignInClick} class="w-33%">
            Sign in
          </GButton>
        </div>
      </div>
    </>
  );
};
