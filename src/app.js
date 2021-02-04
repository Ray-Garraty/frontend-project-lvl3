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

  const formElement = document.querySelector('form');
  const inputFieldElement = document.querySelector('input');
  const feedbackFieldElement = document.querySelector('div.feedback');
  const feedsContainerElement = document.querySelector('div.feeds');
  const addButtonElement = document.querySelector('button[type="submit"]');
  const postsContainerElement = document.querySelector('div.posts');
  const modalTitleElement = document.querySelector('h5.modal-title');
  const modalBodyElement = document.querySelector('div.modal-body');
  const modalAElement = document.querySelector('div.modal-footer > a.full-article');

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
    inputForm: {
      isValid: true,
      content: '',
      error: null,
    },
    requestState: {
      status: 'idle',
      error: null,
    },
    uiState: {
      /* здесь хранятся не сами посты, а только статус ссылок (элементов 'a') постов
      (был или не был открыт, wasOpened: true/false), а также id постов, ничего лишнего */
      postsElementsState: [],
    },
    feeds: [],
  };

  const state = generateState(initialState, pageElements);

  const handleSubmit = (e) => {
    e.preventDefault();
    state.requestState.error = null;
    state.inputForm.error = null;
    state.inputForm.isValid = true;
    const feedsUrls = state.feeds.flatMap((feed) => feed.url);
    const formData = new FormData(e.target);
    const targetUrl = formData.get('url');
    const validationError = validateUrl(targetUrl, feedsUrls);
    if (validationError) {
      state.inputForm.error = validationError.type;
      state.inputForm.isValid = false;
      return;
    }
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
            return { ...item, id };
          });
          const newPostsElementsState = feed.items.flatMap((item) => {
            const { id } = item;
            return { id, wasOpened: false };
          });
          state.uiState.postsElementsState = [
            ...state.uiState.postsElementsState,
            ...newPostsElementsState,
          ];
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
  };
  formElement.onsubmit = handleSubmit;

  const handlePostClick = (e) => {
    if (e.target.hasAttribute('data-id')) {
      const { id } = e.target.dataset;
      const uiStateOfCurrentLink = _.find(state.uiState.postsElementsState, { id });
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
        .finally((response) => {
          if (!response) {
            return;
          }
          const feed = parseRssFeed(response.data.contents);
          const newItems = _.differenceWith(feed.items,
            currentFeed.items,
            (oldItem, newItem) => oldItem.title === newItem.title)
            .map((item) => {
              const id = _.uniqueId();
              return { ...item, id };
            });
          const newPostsElementsState = newItems.flatMap((item) => {
            const { id } = item;
            return { id, wasOpened: false };
          });
          currentFeed.items = _.flatten([newItems, currentFeed.items]);
          state.uiState.postsElementsState = [
            ...state.uiState.postsElementsState,
            ...newPostsElementsState,
          ];
        });
    });
    Promise.all(promises)
      .then(setTimeout(() => updateRssFeedsContinuously(watchedstate, timeout), timeout));
  };
  setTimeout(() => updateRssFeedsContinuously(state, updateInterval), updateInterval);
};
