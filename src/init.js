import i18next from 'i18next';
import 'bootstrap';
import app from './app.js';
import { en, ru } from './translations.js';
import watchedstate from './watchers.js';

export default () => {
  i18next.init({
    lng: 'ru',
    debug: true,
    resources: { en, ru },
  }).then(() => {
    app(watchedstate);
  });
};
