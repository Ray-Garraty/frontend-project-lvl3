/* eslint-disable no-param-reassign */
import _ from 'lodash';
import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import parseRssFeed from './parser.js';
import { stringIsValidUrl, isUrlAlreadyLoaded } from './validator.js';

export default () => {
  const addLinkClickHandler = (linkElement, posts, state) => {
    linkElement.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const viewedPost = posts.filter((post) => post.id === id);
      viewedPost.wasOpened = true;
      state.viewedPostsIds.push(id);
    });
  };

  const addPreviewButtonClickHandler = (buttonElement, posts, state) => {
    buttonElement.addEventListener('click', (e) => {
      const id = e.target.previousSibling.getAttribute('data-id');
      const viewedPost = posts.filter((post) => post.id === id);
      viewedPost.wasOpened = true;
      state.viewedPostsIds.push(id);
      // eslint-disable-next-line no-param-reassign
      state.currentPreviewPost = viewedPost;
    });
  };

  const renderPreviewWindow = (post) => {
    const titleElement = document.querySelector('h5.modal-title');
    titleElement.textContent = post.title;
    const bodyElement = document.querySelector('div.modal-body');
    bodyElement.textContent = post.description;
    const aElement = document.querySelector('a.full-article');
    aElement.setAttribute('href', post.link);
  };

  const renderInputForm = (isFormValid, error, message) => {
    const inputField = document.querySelector('input');
    if (isFormValid) {
      inputField.classList.remove('is-invalid');
    } else {
      inputField.classList.add('is-invalid');
    }
    const feedbackField = document.querySelector('div.feedback');
    console.log(error, message);
    feedbackField.textContent = i18next.t(error || message);
    if (message === 'rss_loaded') {
      feedbackField.classList.remove('text-danger');
      feedbackField.classList.add('text-success');
    } else {
      feedbackField.classList.remove('text-success');
      feedbackField.classList.add('text-danger');
    }
  };

  const renderFeedLoadingProcess = (isButtonDisabled) => {
    const button = document.querySelector('button[type="submit"]');
    if (isButtonDisabled) {
      button.disabled = true;
    } else {
      button.disabled = false;
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

  const renderPosts = (posts, state) => {
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
      link.setAttribute('data-id', post.id);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.textContent = post.title;
      addLinkClickHandler(link, posts, state);
      item.appendChild(link);
      const button = document.createElement('button');
      button.classList.add('btn', 'btn-primary', 'btn-sm');
      button.setAttribute('type', 'button');
      button.setAttribute('data-id', post.id);
      button.setAttribute('data-toggle', 'modal');
      button.setAttribute('data-target', '#modal');
      button.textContent = i18next.t('preview');
      addPreviewButtonClickHandler(button, posts, state);
      item.appendChild(button);
      postsList.appendChild(item);
    });
  };

  const renderViewedPosts = (ids) => {
    const aElements = document.querySelectorAll('a');
    const viewedPosts = (Array.from(aElements))
      .filter((element) => ids.include(element.getAttribute('data-id')));
    viewedPosts.forEach((post) => {
      post.classList.remove('font-weight-bold');
      post.classList.add('font-weight-normal');
    });
  };

  const initialState = {
    currentState: 'idle',
    inputForm: {
      isValid: false,
      content: '',
      error: '',
    },
    message: '',
    feeds: [],
    viewedPostsIds: [],
    currentPreviewPost: '',
  };

  const watchedState = onChange(initialState, (path, value) => {
    if (path === 'currentState') {
      switch (value) {
        case 'invalidInput':
          renderInputForm(false, initialState.inputForm.error, initialState.message);
          break;
        case 'sending':
          renderFeedLoadingProcess(true);
          break;
        case 'invalidRss':
        case 'failedRequest':
          renderFeedLoadingProcess(false);
          renderInputForm(true, initialState.message);
          break;
        case 'success':
          renderFeedLoadingProcess(false);
          renderInputForm(true, null, initialState.message);
          break;
        default:
          console.log('Unexpected currentState: ', value);
          break;
      }
    }
    if (path === 'feeds') {
      renderFeeds(initialState.feeds);
      const posts = initialState.feeds.flatMap((feed) => feed.items);
      renderPosts(posts, initialState);
    }
    if (path === 'viewedPostsIds') {
      renderViewedPosts(initialState.viewedPostsIds);
    }
    if (path === 'currentPreviewPost') {
      renderPreviewWindow(value);
    }
  });

  const proxies = {
    allorigins: 'https://api.allorigins.win/get?url=',
    heroku: 'https://cors-anywhere.herokuapp.com/',
    htmldriven: 'https://cors-proxy.htmldriven.com/?url=',
    thingproxy: 'https://thingproxy.freeboard.io/fetch/',
    whateverorigin: 'http://www.whateverorigin.org/get?url=',
    alloworigin: 'http://alloworigin.com/get?url=',
    yacdn: 'https://yacdn.org/serve/',
  };

  const currentProxy = proxies.allorigins;

  const addButton = document.querySelector('button[type="submit"]');
  const inputForm = document.querySelector('input');

  const addAddButtonClickHandler = (button, form, state) => {
    const handleAddClick = (e) => {
      e.preventDefault();
      state.message = '';
      state.inputForm.error = '';
      state.inputForm.content = form.value;
      if (!stringIsValidUrl(state.inputForm.content)) {
        state.inputForm.error = 'url_invalid';
        state.currentState = 'invalidInput';
      } else if (isUrlAlreadyLoaded(state.inputForm.content, state.feeds)) {
        state.message = 'rss_duplicate';
        state.currentState = 'invalidInput';
      } else {
        state.currentState = 'sending';
        axios
          .get(`${currentProxy}${encodeURIComponent(state.inputForm.content)}`)
          .then((response) => {
            const { error, feed } = parseRssFeed(response.data.contents, _.uniqueId);
            if (error) {
              state.message = 'rss_invalid';
              state.currentState = 'invalidRss';
            } else {
              state.message = 'rss_loaded';
              state.currentState = 'success';
              feed.url = state.inputForm.content;
              state.inputForm.content = '';
              state.feeds = [feed, ...state.feeds];
            }
          })
          .catch(() => {
            state.message = 'network_error';
            state.currentState = 'failedRequest';
          });
      }
    };
    button.onclick = handleAddClick;
  };

  addAddButtonClickHandler(addButton, inputForm, watchedState);

  const interval = 5000;

  const updateRssFeeds = (state) => {
    state.feeds.forEach((currentFeed) => {
      axios
        .get(`${currentProxy}${encodeURIComponent(currentFeed.url)}`)
        .then((response) => {
          const { error, feed } = parseRssFeed(response.data.contents, _.uniqueId);
          currentFeed.items = _.uniqWith([...feed.items, ...currentFeed.items], _.isEqual);
        })
        .catch(() => {
          state.message = 'network_error';
          state.currentState = 'failedRequest';
        });
    });
  };

  const updateRssFeedsContinuously = (state, interval) => {
    updateRssFeeds(state);
    setTimeout(updateRssFeedsContinuously, interval, state, interval);
  };

  // setTimeout(updateRssFeedsContinuously, interval, watchedState, interval); 
};
