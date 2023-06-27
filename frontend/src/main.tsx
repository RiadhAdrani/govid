import './style/index.scss';
import { createRouter, mountApp } from '@riadh-adrani/ruvy';
import 'virtual:uno.css';
import App from './App';
import ROUTES from './router/routes';

const hostElement = document.querySelector<HTMLDivElement>('#app')!;

createRouter(ROUTES);

mountApp({ hostElement, callback: App });
