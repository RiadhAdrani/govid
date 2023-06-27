import { DOMEvent, navigate, useContext, useReactive } from '@riadh-adrani/ruvy';
import { SignupBody } from '../types/user';
import { UserContext } from '../context/User.context';
import GButton from '../components/Button/G.Button';
import GInput from '../components/Button/G.Input';
import GoogleSpinner from '../components/Spinner/Google.spinner';

export default () => {
  const { signup } = useContext(UserContext);

  const loading = useReactive({ value: false });

  const form = useReactive<SignupBody>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  const updateFormField = (field: keyof SignupBody, e: DOMEvent<InputEvent, HTMLInputElement>) => {
    form[field] = e.currentTarget.value;
  };

  const onSignUpClick = () => {
    if (loading.value) return;

    loading.value = true;

    signup({ ...form })
      .then(() => {
        // if success, we redirect to signin
        navigate('/sign-in');
      })
      .catch(() => {
        // if failed show alert
        alert('unable to create user');
      })
      .finally(() => {
        loading.value = false;
      });
  };

  return (
    <>
      <div class="relative col gap-8 border-[#2e2e2e] border-1px border-solid p-x-10 p-y-15 rounded-15px w-350px m-x-auto text-[1.1em]">
        <div class="col">
          <h4>Govid</h4>
          <h3 class="text-green">Create an account</h3>
          <h5>Enter your data</h5>
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
            placeholder="First name"
            type="text"
            value={form.firstName}
            autocomplete="firstname"
            onInput={(e) => updateFormField('firstName', e)}
          />
          <GInput
            placeholder="Last name"
            type="text"
            value={form.lastName}
            autocomplete="lastname"
            onInput={(e) => updateFormField('lastName', e)}
          />
          <GInput
            placeholder="Password"
            type="password"
            value={form.password}
            autocomplete="password"
            onInput={(e) => updateFormField('password', e)}
          />
        </form>
        <div class={'col self-end items-stretch w-33%'}>
          <GButton onClick={onSignUpClick}>Sign up</GButton>
        </div>
        <div
          if={loading.value}
          class="absolute inset-0px col-center bg-[#0e0e0edd] rounded-inherit"
        >
          <GoogleSpinner />
          <h2 class="m-t-10">Just a moment</h2>
          <h4>Signing you up...</h4>
        </div>
      </div>
    </>
  );
};
