import i18next from 'i18next';
import 'bootstrap';
import app from './app.js';
import { en, ru } from './translations.js';
import createValidator from './validator.js';

export default () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources: { en, ru },
  }).then(() => {
    const validateUrl = createValidator();
    app(validateUrl);
  });
};
