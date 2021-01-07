import onChange from 'on-change';
import { stringIsValidUrl, isUrlAlreadyLoaded } from './validator.js';

export default (state) => {
  const addButton = document.querySelector('button[type="submit"]');
  if (addButton) {
    const inputForm = document.querySelector('input');
    const handleAddClick = (e) => {
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
    addButton.onclick = handleAddClick;
  }
};

/* const addPreviewButtonClickHandler = (button, state) => {
  const handlePreviewButtonClick = (e) => {
    const postId = Number(e.target.previousSibling.getAttribute('data-id'));
    state.viewedPostsIds = postId;
  };
  button.addEventListener('click', handlePreviewButtonClick);
};

const addPostLinkClickHandler = (link, state) => {
  const handleLinkClick = (e) => {
    const postId = Number(e.target.getAttribute('data-id'));
    state.viewedPostsIds = postId;
  };
  link.onclick = handleLinkClick;
};
export { addPreviewButtonClickHandler, addPostLinkClickHandler };
*/
