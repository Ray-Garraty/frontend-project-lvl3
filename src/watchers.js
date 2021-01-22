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
  const { addButtonElement } = pageElements;
  const { inputFieldElement } = pageElements;
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
  let [feedsListElement] = feedsContainerElement.getElementsByTagName('ul');
  if (feedsListElement) {
    feedsListElement.innerHTML = '';
  } else {
    const feedsHeader = document.createElement('h2');
    feedsHeader.textContent = i18next.t('feeds_header');
    feedsContainerElement.appendChild(feedsHeader);
    feedsListElement = document.createElement('ul');
    feedsListElement.classList.add('list-group', 'mb-5');
    feedsContainerElement.appendChild(feedsListElement);
  }
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

const renderPosts = (posts, pageElements) => {
  const { postsContainerElement } = pageElements;
  let [postsListElement] = postsContainerElement.getElementsByTagName('ul');
  if (postsListElement) {
    postsListElement.innerHTML = '';
  } else {
    const postsHeader = document.createElement('h2');
    postsHeader.textContent = i18next.t('posts_header');
    postsContainerElement.appendChild(postsHeader);
    postsListElement = document.createElement('ul');
    postsListElement.classList.add('list-group');
    postsContainerElement.appendChild(postsListElement);
  }
  posts.forEach((post) => {
    const item = document.createElement('li');
    item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    postsListElement.appendChild(item);
    const link = document.createElement('a');
    link.className = post.wasOpened ? 'font-weight-normal' : 'font-weight-bold';
    link.setAttribute('href', post.link);
    link.dataset.id = post.id;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.textContent = post.title;
    item.appendChild(link);
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.setAttribute('type', 'button');
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

const renderViewedPosts = (ids, pageElements) => {
  const { postsContainerElement } = pageElements;
  const aElements = Array.from(postsContainerElement.getElementsByTagName('a'));
  aElements.forEach((element) => {
    if (ids.includes(element.dataset.id)) {
      element.classList.remove('font-weight-bold');
      element.classList.add('font-weight-normal');
    }
  });
};

export default (state, pageElements) => {
  const watchedState = onChange(state, (path, value) => {
    const posts = state.feeds.flatMap((feed) => feed.items);
    if (path === 'request.status') {
      switch (value) {
        case 'sending':
          renderInputForm(true, pageElements);
          toggleFormReadonlyState('readonly', pageElements);
          break;
        case 'fail':
          toggleFormReadonlyState('default', pageElements);
          renderError(state.request.error, pageElements);
          break;
        case 'success':
          toggleFormReadonlyState('default', pageElements);
          renderMessage(pageElements);
          break;
        default:
          throw new Error(`Unexpected request status: ${value}`);
      }
    }
    if (path === 'uiState.inputForm.isValid') {
      renderInputForm(false, pageElements);
      renderError(state.uiState.inputForm.error, pageElements);
    }
    if (path === 'feeds') {
      renderFeeds(state.feeds, pageElements);
      renderPosts(posts, pageElements);
    }
    if (path.endsWith('wasOpened')) {
      const idsOfOpenedPosts = state.uiState.posts
        .filter((post) => post.wasOpened)
        .map((post) => post.id);
      renderViewedPosts(idsOfOpenedPosts, pageElements);
    }
    if (path === 'uiState.currentPreviewPostId') {
      const [currentPreviewPost] = state.feeds
        .flatMap((feed) => feed.items
          .filter((item) => item.id === value));
      renderModal(currentPreviewPost, pageElements);
    }
  });
  return watchedState;
};
