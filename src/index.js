import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import { en, ru } from './translations.js';
import controller from './controller.js';
import updateRssFeedsContinuously from './updater';
import generateInitialState from './model.js';

i18next.init({
  lng: 'ru',
  debug: true,
  resources: { en, ru },
}).then(() => {
  const watchedState = generateInitialState();
  controller(watchedState);
  const interval = 5000;
  setTimeout(updateRssFeedsContinuously, interval, watchedState, interval);
});
