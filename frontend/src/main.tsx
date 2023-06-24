import './style.css';
import { mountApp, useReactive } from '@riadh-adrani/ruvy';

const hostElement = document.querySelector<HTMLDivElement>('#app')!;

const App = () => {
  const count = useReactive({ value: 0 });

  const onClick = () => count.value++;

  return (
    <div>
      <img src={'/vite.svg'} class="logo" alt="Vite logo" />
      <h1>Vite + Ruvy</h1>
      <p style={{ marginTop: '-20px' }}>
        <sub>Ruvy is a front-end framework inspired from Reacted</sub>
        <br />
        <sub>It is built for showcase purposes only.</sub>
      </p>
      <button onClick={onClick}>
        You clicked : {count.value} time{count.value > 1 ? 's' : ''}
      </button>
      <p>
        <a href="https://github.com/RiadhAdrani/ruvy" target="_blank">
          <span>Ruvy on GitHub</span>
        </a>
      </p>
    </div>
  );
};

mountApp({ hostElement, callback: App });
