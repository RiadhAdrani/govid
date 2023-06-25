import NavBar from './components/NavBar/NavBar';
import { UIProvider } from './context/UI';

export default () => {
  return (
    <UIProvider>
      <NavBar />
    </UIProvider>
  );
};
