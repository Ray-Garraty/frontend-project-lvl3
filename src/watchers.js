import i18next from 'i18next';
import onChange from 'on-change';

const renderInputForm = (isFormValid, pageElements) => {
  const { inputFieldElement } = pageElements;
  if (isFormValid) {
    inputFieldElement.classList.remove('is-invalid');
  } else {
    inputFieldElement.classList.add('is-invalid');
  }
};

const toggleFormReadonlyState = (formState, pageElements) => {
  const { addButtonElement, inputFieldElement } = pageElements;
  if (formState === 'readonly') {
    addButtonElement.disabled = true;
    inputFieldElement.setAttribute('readonly', true);
  } else {
    addButtonElement.disabled = false;
    inputFieldElement.removeAttribute('readonly');
  }
};

const renderMessage = (pageElements) => {
  const { feedbackFieldElement } = pageElements;
  feedbackFieldElement.textContent = i18next.t('rss_loaded');
  feedbackFieldElement.classList.remove('text-danger');
  feedbackFieldElement.classList.add('text-success');
};

const renderError = (error, pageElements) => {
  const { feedbackFieldElement } = pageElements;
  feedbackFieldElement.textContent = i18next.t(error);
  feedbackFieldElement.classList.remove('text-success');
  feedbackFieldElement.classList.add('text-danger');
};

const renderFeeds = (feeds, pageElements) => {
  const { feedsContainerElement } = pageElements;
  feedsContainerElement.innerHTML = '';
  const feedsHeader = document.createElement('h2');
  feedsHeader.textContent = i18next.t('feeds_header');
  feedsContainerElement.appendChild(feedsHeader);
  const feedsListElement = document.createElement('ul');
  feedsListElement.classList.add('list-group', 'mb-5');
  feedsContainerElement.appendChild(feedsListElement);
  feeds.forEach((feed) => {
    const item = document.createElement('li');
    item.classList.add('list-group-item');
    const header = document.createElement('h3');
    header.textContent = feed.title;
    item.appendChild(header);
    const description = document.createElement('p');
    description.textContent = feed.description;
    item.appendChild(description);
    feedsListElement.appendChild(item);
  });
};

const renderPosts = (posts, viewedPostsIds, pageElements) => {
  const { postsContainerElement } = pageElements;
  postsContainerElement.innerHTML = '';
  const postsHeader = document.createElement('h2');
  postsHeader.textContent = i18next.t('posts_header');
  postsContainerElement.appendChild(postsHeader);
  const postsListElement = document.createElement('ul');
  postsListElement.classList.add('list-group');
  postsContainerElement.appendChild(postsListElement);
  posts.forEach((post) => {
    const item = document.createElement('li');
    item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    postsListElement.appendChild(item);
    const link = document.createElement('a');
    link.className = viewedPostsIds.includes(post.id) ? 'font-weight-normal' : 'font-weight-bold';
    link.setAttribute('href', post.link);
    link.dataset.id = post.id;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.textContent = post.title;
    item.appendChild(link);
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('name', 'preview');
    button.dataset.id = post.id;
    button.dataset.toggle = 'modal';
    button.dataset.target = '#modal';
    button.textContent = i18next.t('preview');
    item.appendChild(button);
    postsListElement.appendChild(item);
  });
};

const renderModal = (post, pageElements) => {
  const { modalTitleElement, modalBodyElement, modalAElement } = pageElements;
  modalTitleElement.textContent = post.title;
  modalBodyElement.textContent = post.description;
  modalAElement.setAttribute('href', post.link);
};

export default (state, pageElements) => {
  const watchedState = onChange(state, (path, value) => {
    const posts = state.feeds.flatMap((feed) => feed.items);
    const idsOfOpenedPosts = state.uiState.postsElementsState
      .filter((post) => post.wasOpened)
      .map((post) => post.id);
    if (path === 'requestState.status') {
      switch (value) {
        case 'sending':
          renderInputForm(true, pageElements);
          toggleFormReadonlyState('readonly', pageElements);
          break;
        case 'fail':
          toggleFormReadonlyState('default', pageElements);
          renderError(state.requestState.error, pageElements);
          break;
        case 'success':
          toggleFormReadonlyState('default', pageElements);
          renderMessage(pageElements);
          break;
        default:
          throw new Error(`Unexpected requestState status: ${value}`);
      }
    }
    if (path === 'inputForm.isValid') {
      renderInputForm(false, pageElements);
      renderError(state.inputForm.error, pageElements);
    }
    if (path === 'feeds') {
      renderFeeds(state.feeds, pageElements);
      renderPosts(posts, idsOfOpenedPosts, pageElements);
    }
    if (path.endsWith('wasOpened')) {
      renderPosts(posts, idsOfOpenedPosts, pageElements);
    }
    if (path === 'uiState.currentPreviewPostId') {
      const currentPreviewPost = posts.find((post) => post.id === value);
      renderModal(currentPreviewPost, pageElements);
    }
  });
  return watchedState;
};
