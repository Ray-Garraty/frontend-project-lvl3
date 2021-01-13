import i18next from 'i18next';
import onChange from 'on-change';
import addLinkClickHandler from './app.js';

const renderPreviewWindow = (post) => {
  const titleElement = document.querySelector('h5.modal-title');
  titleElement.textContent = post.title;
  const bodyElement = document.querySelector('div.modal-body');
  bodyElement.textContent = post.description;
  const aElement = document.querySelector('a.full-article');
  aElement.setAttribute('href', post.link);
};

const renderInputForm = (isFormValid) => {
  const inputField = document.querySelector('input');
  if (isFormValid) {
    inputField.classList.remove('is-invalid');
  } else {
    inputField.classList.add('is-invalid');
  }
};

const renderMainButton = (buttonState) => {
  const button = document.querySelector('button[type="submit"]');
  if (buttonState === 'buttonIsDisabled') {
    button.disabled = true;
  } else {
    button.disabled = false;
  }
};

const renderMessage = (message, style) => {
  const feedbackField = document.querySelector('div.feedback');
  feedbackField.textContent = i18next.t(message);
  if (style === 'success') {
    feedbackField.classList.remove('text-danger');
    feedbackField.classList.add('text-success');
  } else {
    feedbackField.classList.remove('text-success');
    feedbackField.classList.add('text-danger');
  }
};

const renderFeeds = (feeds) => {
  const feedsContainer = document.querySelector('div.feeds');
  if (feeds.length === 1) {
    const feedsHeader = document.createElement('h2');
    feedsHeader.textContent = i18next.t('feeds_header');
    feedsContainer.appendChild(feedsHeader);
    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-group', 'mb-5');
    feedsContainer.appendChild(feedsList);
  }
  const feedsList = document.querySelector('ul.list-group.mb-5');
  const uls = document.querySelectorAll('ul.list-group');
  uls.forEach((ul) => {
    while (ul.firstChild) {
      ul.firstChild.remove();
    }
  });
  feeds.forEach((feed) => {
    const item = document.createElement('li');
    item.classList.add('list-group-item');
    const header = document.createElement('h3');
    header.textContent = feed.title;
    item.appendChild(header);
    const description = document.createElement('p');
    description.textContent = feed.description;
    item.appendChild(description);
    feedsList.appendChild(item);
  });
};

const renderPosts = (posts) => {
  const postsContainer = document.querySelector('div.posts');
  const postsHeader = document.querySelector('div.posts > h2');
  if (!postsHeader) {
    const newPostsHeader = document.createElement('h2');
    newPostsHeader.textContent = i18next.t('posts_header');
    postsContainer.appendChild(newPostsHeader);
  }
  const postsList = document.createElement('ul');
  postsList.classList.add('list-group');
  postsContainer.appendChild(postsList);
  posts.forEach((post) => {
    const item = document.createElement('li');
    item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    postsList.appendChild(item);
    const link = document.createElement('a');
    link.className = post.wasOpened ? 'font-weight-normal' : 'font-weight-bold';
    link.setAttribute('href', post.link);
    link.dataset.id = post.id;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.textContent = post.title;
    addLinkClickHandler(link, post);
    item.appendChild(link);
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.dataset.id = post.id;
    button.dataset.toggle = 'modal';
    button.dataset.target = '#modal';
    button.textContent = i18next.t('preview');
    button.addEventListener('click', () => {
      state.uiState.links[post.id].wasOpened = true;
    });
    item.appendChild(button);
    postsList.appendChild(item);
  });
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

const addLinksClickHandlers = (state) => {
  const linksElements = document.querySelectorAll('li > a');
  linksElements.forEach((element) => {
    element.addEventListener('click', (e) => {
      console.log('Click!');
      const { id } = e.target.dataset;
      _.find
      state.uiState.links[id].wasOpened = true;
    });
  });
};

const state = {
  currentState: 'idle',
  inputForm: {
    isValid: false,
    content: '',
    error: '',
  },
  message: '',
  feeds: [],
  uiState: {
    links: {},
  },
};

const watchedState = onChange(state, (path, value) => {
  const posts = state.feeds.flatMap((feed) => feed.items);
  if (path === 'currentState') {
    switch (value) {
      case 'invalidInput':
        renderInputForm('invalid');
        renderMessage(state.inputForm.error, 'failure');
        break;
      case 'sending':
        renderMainButton('buttonIsDisabled');
        break;
      case 'invalidRss':
      case 'failedRequest':
        renderMainButton('buttonIsEnabled');
        renderMessage(state.message, 'failure');
        break;
      case 'success':
        renderMainButton('buttonIsEnabled');
        renderMessage(state.message, 'success');
        break;
      default:
        throw new Error(`Unexpected currentState: ${value}`);
    }
  }
  if (path === 'feeds') {
    renderFeeds(state.feeds);
    renderPosts(posts);
    
  }
  if (path === 'uiState.links') {
    const ids = posts.filter((post) => post.wasOpened).map((post) => post.id);
    renderViewedPosts(ids);
  }
  if (path === 'currentPreviewPost') {
    renderPreviewWindow(value);
  }
});

export default watchedState;
