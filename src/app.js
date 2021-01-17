/* eslint-disable no-shadow */
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
  const state = generateState(initialState, pageElements);
  const schema = yup.string().url();

  const proxy = 'allorigins';
  // eslint-disable-next-line no-unused-vars
  const addNewFeed = (feed, state, newItems) => {
    state.currentState = 'success';
    feed.url = state.uiState.inputForm.content;
    state.uiState.inputForm.content = '';
    feed.id = _.uniqueId();
    state.feeds = [feed, ...state.feeds];
  };
  const updateExistingFeed = (feed, state, newItems) => {
    feed.items = _.flatten([newItems, feed.items]);
  };
  const handleAddError = (state) => {
    state.error = 'rss_invalid';
    state.currentState = 'fail';
  };
  const handleUpdateError = (state) => {
    state.error = 'network_error';
    state.currentState = 'fail';
  };

  const retrieveFeed = (url, feed, state, proxyName, onResolve, onReject) => {
    const proxies = {
      allorigins: 'https://api.allorigins.win/get?url=',
      heroku: 'https://cors-anywhere.herokuapp.com/',
      htmldriven: 'https://cors-proxy.htmldriven.com/?url=',
      thingproxy: 'https://thingproxy.freeboard.io/fetch/',
      whateverorigin: 'http://www.whateverorigin.org/get?url=',
      alloworigin: 'http://alloworigin.com/get?url=',
      yacdn: 'https://yacdn.org/serve/',
    };
    const currentProxy = proxies[proxyName];
    axios
      .get(`${currentProxy}${encodeURIComponent(url)}`)
      .then((response) => {
        try {
          const newData = parseRssFeed(response.data.contents);
          const newItems = _.differenceWith(newData.items, feed.items, _.isEqual);
          newItems.forEach((item) => {
            const id = _.uniqueId();
            item.id = id;
            const post = { id, wasOpened: false };
            state.uiState.posts = [post, ...state.uiState.posts];
          });
          onResolve(newData, state, newItems);
        } catch (error) {
          console.error('Here!', error);
          onReject(state);
        }
      })
      .catch(() => {
        state.error = 'network_error';
        state.currentState = 'fail';
      });
  };

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
      retrieveFeed(state.uiState.inputForm.content, [], state, proxy, addNewFeed, handleAddError);
    } catch (error) {
      console.error('There!', error);
      state.uiState.inputForm.isValid = false;
      state.uiState.inputForm.error = error.type;
    }
  };
  addButtonElement.onclick = handleAddClick;

  const handlePostClick = (e) => {
    const tag = e.target.tagName;
    if (tag === 'A' || tag === 'BUTTON') {
      const { id } = e.target.dataset;
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

  const updateRssFeedsContinuously = (state, timeout) => {
    // eslint-disable-next-line array-callback-return
    const promises = state.feeds.map((currentFeed) => retrieveFeed(
      currentFeed.url,
      currentFeed,
      state,
      proxy,
      updateExistingFeed,
      handleUpdateError,
    ));
    Promise.all(promises)
      .then(setTimeout(() => updateRssFeedsContinuously(state, timeout), timeout));
  };
  setTimeout(() => updateRssFeedsContinuously(state, updateInterval), updateInterval);
};
