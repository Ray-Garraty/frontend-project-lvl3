/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import onChange from 'on-change';

export default (state, pageElements) => {
  const renderInputForm = (isFormValid) => {
    const { inputFieldElement } = pageElements;
    if (isFormValid) {
      inputFieldElement.classList.remove('is-invalid');
    } else {
      inputFieldElement.classList.add('is-invalid');
    }
  };

  const toggleFormReadonlyState = (formState) => {
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

  const renderMessage = () => {
    const { feedbackFieldElement } = pageElements;
    feedbackFieldElement.textContent = i18next.t('rss_loaded');
    feedbackFieldElement.classList.remove('text-danger');
    feedbackFieldElement.classList.add('text-success');
  };

  const renderError = (error) => {
    const { feedbackFieldElement } = pageElements;
    feedbackFieldElement.textContent = i18next.t(error);
    feedbackFieldElement.classList.remove('text-success');
    feedbackFieldElement.classList.add('text-danger');
  };

  const renderFeeds = (feeds) => {
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

  const renderPosts = (posts) => {
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

  const renderModal = (post) => {
    const titleElement = document.querySelector('h5.modal-title');
    titleElement.textContent = post.title;
    const bodyElement = document.querySelector('div.modal-body');
    bodyElement.textContent = post.description;
    const aElement = document.querySelector('a.full-article');
    aElement.setAttribute('href', post.link);
  };

  const renderViewedPosts = (ids) => {
    const aElements = document.querySelectorAll('li > a');
    aElements.forEach((element) => {
      if (ids.includes(element.dataset.id)) {
        element.classList.remove('font-weight-bold');
        element.classList.add('font-weight-normal');
      }
    });
  };

  const watchedState = onChange(state, (path, value) => {
    const posts = state.feeds.flatMap((feed) => feed.items);
    if (path === 'currentState') {
      switch (value) {
        case 'sending':
          toggleFormReadonlyState('readonly');
          break;
        case 'fail':
          toggleFormReadonlyState('default');
          renderError(state.error);
          break;
        case 'success':
          toggleFormReadonlyState('default');
          renderMessage();
          break;
        default:
          throw new Error(`Unexpected currentState: ${value}`);
      }
    }
    /* следующую проверку я убрать не могу, т.к. это единственный способ отреагировать на
    ситуацию, при которой пользователь, например, сначала ввёл в форму неправильный url,
    а после этого ввёл правильный url, но который уже был загружен. В этой ситуации
    состояние формы не меняется (в обоих случаях state.inputForm.isValid === 'false'),
    поэтому единственный способ заставить вотчер отреагировать и вывести новую ошибку - повесить
    проверку на изменение содержимого ошибки (uiState.inputForm.error) */
    if (path === 'uiState.inputForm.error') {
      renderInputForm('invalid');
      renderError(state.uiState.inputForm.error);
    }
    if (path === 'feeds') {
      renderFeeds(state.feeds);
      renderPosts(posts);
    }
    if (path.startsWith('uiState.posts')) {
      const idsOfOpenedPosts = state.uiState.posts
        .filter((post) => post.wasOpened)
        .map((post) => post.id);
      renderViewedPosts(idsOfOpenedPosts);
    }
    // следующая проверка нужна для прокидывания id поста в renderModal
    if (path === 'uiState.currentPreviewPostId') {
      const [currentPreviewPost] = state.feeds
        .flatMap((feed) => feed.items
          .filter((item) => item.id === value));
      renderModal(currentPreviewPost);
    }
  });
  return watchedState;
};
