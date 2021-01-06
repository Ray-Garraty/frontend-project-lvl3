import onChange from 'on-change';
import { stringIsValidUrl, isUrlAlreadyLoaded } from './validator.js';

export default (state) => {
  const button = document.querySelector('button[type="submit"]');
  if (button) {
    const inputForm = document.querySelector('input');
    const handleClick = (e) => {
      e.preventDefault();
      const userString = inputForm.value;
      stringIsValidUrl(userString)
        .then((isValid) => {
          if (userString && isValid) {
            if (isUrlAlreadyLoaded(userString, state)) {
              onChange.target(state).inputForm.isValid = false;
              state.inputForm.error = 'rss_duplicate';
            } else {
              onChange.target(state).inputForm.error = '';
              onChange.target(state).inputForm.content = userString;
              onChange.target(state).currentState = 'sending';
              state.inputForm.isValid = true;
            }
          } else {
            onChange.target(state).inputForm.isValid = false;
            onChange.target(state).currentState = 'error';
            state.inputForm.error = 'url_invalid';
          }
        });
    };
    button.onclick = handleClick;
  }
};
