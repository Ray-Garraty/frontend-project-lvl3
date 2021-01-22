/* eslint-disable no-param-reassign */
import _ from 'lodash';
import axios from 'axios';
import onChange from 'on-change';
import parseRssFeed from './parser.js';
import generateState from './watchers.js';
import createValidator from './validator.js';

const updateInterval = 5000;
const validateUrl = createValidator();
const proxy = 'https://api.allorigins.win/get?url=';

const inputFieldElement = document.querySelector('input');
const feedbackFieldElement = document.querySelector('div.feedback');
const feedsContainerElement = document.querySelector('div.feeds');
const addButtonElement = document.querySelector('button[type="submit"]');
const postsContainerElement = document.querySelector('div.posts');
const modalTitleElement = document.querySelector('h5.modal-title');
const modalBodyElement = document.querySelector('div.modal-body');
const modalAElement = document.querySelector('div.modal-footer > a.full-article');
const inputForm = document.querySelector('input');

const pageElements = {
  inputFieldElement,
  feedbackFieldElement,
  feedsContainerElement,
  addButtonElement,
  postsContainerElement,
  modalTitleElement,
  modalBodyElement,
  modalAElement,
};

const initialState = {
  request: {
    status: 'idle',
    error: '',
  },
  uiState: {
    inputForm: {
      isValid: true,
      content: '',
      error: '',
    },
    posts: [],
  },
  feeds: [],
};

export default () => {
  const state = generateState(initialState, pageElements);

  const createRequestUrl = (url, proxyString) => {
    /* пришлось сделать такой костыль, т.к. если на вход поступает объект Proxy(URL),
    то выскакивает ошибка о невозможности использования метода toString() */
    try {
      return new URL(`${proxyString}${url.toString()}`);
    } catch (error) {
      return createRequestUrl(onChange.target(url), proxyString);
    }
  };

  const handleAddClick = (e) => {
    e.preventDefault();
    state.request.error = '';
    state.uiState.inputForm.error = '';
    state.uiState.inputForm.isValid = true;
    /* строка кода ниже нужна для извлечения url-ов из уже существующих фидов для
    последующей передачи в функцию "validateUrl", это требуется для её корректной работы */
    const feedsUrls = state.feeds.flatMap((feed) => onChange.target(feed).url.toString());
    try {
      validateUrl(inputForm.value, feedsUrls);
      const userInputUrl = new URL(inputForm.value);
      const requestUrl = createRequestUrl(userInputUrl, proxy);
      state.request.status = 'sending';
      axios
        .get(requestUrl)
        .then((response) => {
          try {
            const feed = parseRssFeed(response.data.contents);
            state.request.status = 'success';
            feed.url = userInputUrl;
            feed.id = _.uniqueId();
            feed.items = feed.items.flatMap((item) => {
              const id = _.uniqueId();
              item.id = id;
              return item;
            });
            const posts = feed.items.flatMap((item) => {
              const { id } = item;
              return { id, wasOpened: false };
            });
            state.uiState.posts = [...onChange.target(state.uiState.posts), ...posts];
            state.feeds = [feed, ...state.feeds];
          } catch (error) {
            console.error(error);
            state.request.error = 'rss_invalid';
            state.request.status = 'fail';
          }
        })
        .catch((error) => {
          console.error(error);
          state.request.error = 'network_error';
          state.request.status = 'fail';
        });
    } catch (error) {
      state.uiState.inputForm.error = error.type;
      state.uiState.inputForm.isValid = false;
    }
  };
  addButtonElement.onclick = handleAddClick;

  const handlePostClick = (e) => {
    if (e.target.hasAttribute('data-id')) {
      const { id } = e.target.dataset;
      const uiStateOfCurrentLink = _.find(state.uiState.posts, { id });
      uiStateOfCurrentLink.wasOpened = true;
      state.uiState.currentPreviewPostId = id;
    }
  };
  postsContainerElement.onclick = handlePostClick;

  const updateRssFeedsContinuously = (watchedstate, timeout) => {
    const promises = watchedstate.feeds.map((currentFeed) => {
      /* в строке кода ниже я вынужден использовать "onChange.target", т.к. по-другому извлечь url
      из currentFeed не получилось, т.к. он завёрнут в объект Proxy, что вызывает ошибку */
      const requestUrl = createRequestUrl(currentFeed.url, proxy);
      return axios
        .get(requestUrl)
        .then((response) => {
          const feed = parseRssFeed(response.data.contents);
          const newItems = _.differenceWith(feed.items,
            onChange.target(currentFeed).items,
            (oldItem, newItem) => oldItem.title === newItem.title)
            .map((item) => {
              const id = _.uniqueId();
              item.id = id;
              return item;
            });
          const newPosts = newItems.flatMap((item) => {
            const { id } = item;
            return { id, wasOpened: false };
          });
          currentFeed.items = _.flatten([newItems, currentFeed.items]);
          state.uiState.posts = [...onChange.target(state.uiState.posts), ...newPosts];
        })
        .catch(() => {
          watchedstate.request.error = 'network_error';
          watchedstate.request.status = 'fail';
        });
    });
    Promise.all(promises)
      .then(setTimeout(() => updateRssFeedsContinuously(watchedstate, timeout), timeout));
  };
  setTimeout(() => updateRssFeedsContinuously(state, updateInterval), updateInterval);
};
