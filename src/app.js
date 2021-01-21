/* eslint-disable no-param-reassign */
import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import parseRssFeed from './parser.js';
import generateState from './watchers.js';
import validateUrl from './validator.js';

const updateInterval = 5000;
const schema = yup.string().url();
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
  currentState: 'idle',
  error: '',
  feeds: [],
  uiState: {
    inputForm: {
      isValid: false,
      content: '',
      error: '',
    },
    posts: [],
  },
};

export default () => {
  const state = generateState(initialState, pageElements);

  const createRequestUrl = (url, proxyString) => {
    console.log(url);
    return new URL(`${proxyString}${url.toString()}`);
  };

  const handleAddClick = (e) => {
    e.preventDefault();
    state.error = '';
    state.uiState.inputForm.error = '';
    state.uiState.inputForm.isValid = true;
    /* строка кода ниже нужна для извлечения url-ов из уже существующих фидов для
    последующей передачи в функцию "validateUrl", это нужно для её корректной работы */
    const feedsUrls = state.feeds.flatMap((feed) => feed.url);
    try {
      validateUrl(inputForm.value, feedsUrls, schema);
      const userInputUrl = new URL(inputForm.value);
      const requestUrl = createRequestUrl(userInputUrl, proxy);
      state.currentState = 'sending';
      axios
        .get(requestUrl)
        .then((response) => {
          try {
            const feed = parseRssFeed(response.data.contents);
            state.currentState = 'success';
            feed.url = userInputUrl;
            feed.id = _.uniqueId();
            state.uiState.posts = feed.items.map((item) => {
              const id = _.uniqueId();
              item.id = id;
              return { id, wasOpened: false };
            });
            state.feeds = [feed, ...state.feeds];
          } catch (error) {
            state.error = 'rss_invalid';
            state.currentState = 'fail';
          }
        })
        .catch((error) => {
          console.error(error);
          state.error = 'network_error';
          state.currentState = 'fail';
        });
    } catch (error) {
      console.error(error);
      state.uiState.inputForm.isValid = false;
      state.uiState.inputForm.error = error.type;
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
      console.log(currentFeed);
      const requestUrl = createRequestUrl(currentFeed.url, proxy);
      return axios
        .get(requestUrl)
        .then((response) => {
          const feed = parseRssFeed(response.data.contents);
          const newItems = _.differenceWith(feed.items, currentFeed.items, _.isEqual);
          newItems.forEach((item) => {
            const id = _.uniqueId();
            item.id = id;
            const post = { id, wasOpened: false };
            watchedstate.uiState.posts = [post, ...state.uiState.posts];
          });
          currentFeed.items = _.flatten([newItems, currentFeed.items]);
        })
        .catch(() => {
          watchedstate.error = 'network_error';
          watchedstate.currentState = 'fail';
        });
    });
    Promise.all(promises)
      .then(setTimeout(() => updateRssFeedsContinuously(watchedstate, timeout), timeout));
  };
  setTimeout(() => updateRssFeedsContinuously(state, updateInterval), updateInterval);
};
