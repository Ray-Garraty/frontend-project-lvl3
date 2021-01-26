/* eslint-disable no-param-reassign */
import _ from 'lodash';
import axios from 'axios';
import parseRssFeed from './parser.js';
import generateState from './watchers.js';
import createValidator from './validator.js';

const updateInterval = 5000;
const proxyUrlString = 'https://api.allorigins.win/get';

export default () => {
  const validateUrl = createValidator();
  const createRequestUrl = (targetUrl) => {
    const proxyUrl = new URL(proxyUrlString);
    proxyUrl.searchParams.set('url', targetUrl);
    return proxyUrl.toString();
  };

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
    requestState: {
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

  const state = generateState(initialState, pageElements);

  const handleAddClick = (e) => {
    e.preventDefault();
    state.requestState.error = '';
    state.uiState.inputForm.error = '';
    state.uiState.inputForm.isValid = true;
    const feedsUrls = state.feeds.flatMap((feed) => feed.url);
    try {
      validateUrl(inputForm.value, feedsUrls);
      const targetUrl = inputForm.value;
      const requestUrl = createRequestUrl(targetUrl);
      state.requestState.status = 'sending';
      axios
        .get(requestUrl)
        .then((response) => {
          try {
            const feed = parseRssFeed(response.data.contents);
            feed.url = targetUrl;
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
            state.uiState.posts = [...state.uiState.posts, ...posts];
            state.feeds = [feed, ...state.feeds];
            state.requestState.status = 'success';
          } catch (error) {
            console.error(error);
            state.requestState.error = 'rss_invalid';
            state.requestState.status = 'fail';
          }
        })
        .catch((error) => {
          console.error(error);
          state.requestState.error = 'network_error';
          state.requestState.status = 'fail';
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
      const requestUrl = createRequestUrl(currentFeed.url);
      return axios
        .get(requestUrl)
        .then((response) => {
          const feed = parseRssFeed(response.data.contents);
          const newItems = _.differenceWith(feed.items,
            currentFeed.items,
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
          state.uiState.posts = [...state.uiState.posts, ...newPosts];
        })
        .catch(() => {
          watchedstate.requestState.error = 'network_error';
          watchedstate.requestState.status = 'fail';
        });
    });
    Promise.all(promises)
      .then(setTimeout(() => updateRssFeedsContinuously(watchedstate, timeout), timeout));
  };
  setTimeout(() => updateRssFeedsContinuously(state, updateInterval), updateInterval);
};
