import i18next from 'i18next';
import 'bootstrap/js/dist/modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import app from './app.js';
import { en, ru } from './translations.js';

i18next.init({
  lng: 'ru',
  debug: true,
  resources: { en, ru },
}).then(() => {
  app();
});
