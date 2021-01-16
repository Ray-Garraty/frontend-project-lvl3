/* eslint-disable no-param-reassign */
import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import parseRssFeed from './parser.js';
import generateState from './watchers.js';
import validateString from './validator.js';

const updateInterval = 5000;

export default () => {
  const inputFieldElement = document.querySelector('input');
  const feedbackFieldElement = document.querySelector('div.feedback');
  const feedsContainerElement = document.querySelector('div.feeds');
  const addButtonElement = document.querySelector('button[type="submit"]');
  const postsContainerElement = document.querySelector('div.posts');

  const pageElements = {
    inputFieldElement,
    feedbackFieldElement,
    feedsContainerElement,
    addButtonElement,
    postsContainerElement,
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
      posts: {},
    },
  };
  const state = generateState(initialState, pageElements);
  const schema = yup.string().url();

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
  const retrieveFeed = (url, proxy) => axios.get(`${proxy}${encodeURIComponent(url)}`);

  const inputForm = document.querySelector('input');

  const handleAddClick = (e) => {
    e.preventDefault();
    state.error = '';
    state.uiState.inputForm.error = '';
    state.uiState.inputForm.isValid = true;
    state.uiState.inputForm.content = inputForm.value;
    const feedsUrls = state.feeds.flatMap((feed) => feed.url);
    try {
      validateString(state.uiState.inputForm.content, feedsUrls, schema);
      state.currentState = 'sending';
      retrieveFeed(state.uiState.inputForm.content, currentProxy)
        .then((response) => {
          try {
            const feed = parseRssFeed(response.data.contents);
            state.currentState = 'success';
            feed.url = state.uiState.inputForm.content;
            state.uiState.inputForm.content = '';
            feed.id = _.uniqueId();
            state.uiState.posts = _.flatten([
              state.uiState.posts,
              ...feed.items.map((item) => {
                const id = _.uniqueId();
                item.id = id;
                return { id, wasOpened: false };
              }),
            ]);
            state.feeds = [feed, ...state.feeds];
          } catch (error) {
            console.error(error);
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
    const tag = e.target.tagName;
    if (tag === 'A' || tag === 'BUTTON') {
      const { id } = e.target.dataset;
      console.log(state.uiState.posts);
      const uiStateOfCurrentLink = _.find(state.uiState.posts, { id });
      uiStateOfCurrentLink.wasOpened = true;
      /* далее отдельное состояние 'uiState.currentPreviewPostId' обязательно
      необходимо для того, чтобы передать в вотчер id поста, который надо открыть
      в модальном окне, поскольку это нужно для последующего заполнения
      модального окна силами функции renderModal */
      state.uiState.currentPreviewPostId = id;
    }
  };
  postsContainerElement.onclick = handlePostClick;

  const updateRssFeedsContinuously = (watchedstate, timeout) => {
    if (!_.isEmpty(watchedstate.feeds)) {
      // eslint-disable-next-line array-callback-return
      const promises = watchedstate.feeds.map((currentFeed) => {
        retrieveFeed(currentFeed.url, currentProxy)
          .then((response) => {
            const feed = parseRssFeed(response.data.contents);
            currentFeed.items = _.uniqWith([...feed.items, ...currentFeed.items], _.isEqual);
            const newItems = currentFeed.items.filter((item) => !item.id);
            newItems.forEach((item) => {
              const id = _.uniqueId();
              item.id = id;
              const post = { id, wasOpened: false };
              state.uiState.posts = { post, ...state.uiState.posts };
            });
          })
          .catch(() => {
            watchedstate.message = 'network_error';
            watchedstate.currentState = 'failedRequest';
          });
      });
      Promise.all(promises)
        .then(setTimeout(() => updateRssFeedsContinuously(watchedstate, timeout), timeout));
    }
  };
  // setTimeout(() => updateRssFeedsContinuously(state, updateInterval), updateInterval);
};
