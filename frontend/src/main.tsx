import './style/index.scss';
import { createRouter, mountApp } from '@riadh-adrani/ruvy';
import 'virtual:uno.css';
import App from './App';

const hostElement = document.querySelector<HTMLDivElement>('#app')!;

createRouter([]);

mountApp({ hostElement, callback: App });
