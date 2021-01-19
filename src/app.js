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

  const retrieveFeed = (url, proxyName) => {
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
    return axios.get(`${currentProxy}${encodeURIComponent(url)}`);
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
      retrieveFeed(state.uiState.inputForm.content, proxy)
        .then((response) => {
          try {
            const feed = parseRssFeed(response.data.contents);
            state.currentState = 'success';
            feed.url = state.uiState.inputForm.content;
            state.uiState.inputForm.content = '';
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

  const updateRssFeedsContinuously = (state, timeout) => {
    const promises = state.feeds.map((currentFeed) => {
      retrieveFeed(currentFeed.url, proxy)
        .then((response) => {
          const feed = parseRssFeed(response.data.contents);
          const newItems = _.differenceWith(feed.items, currentFeed.items, _.isEqual);
          newItems.forEach((item) => {
            const id = _.uniqueId();
            item.id = id;
            const post = { id, wasOpened: false };
            state.uiState.posts = [post, ...state.uiState.posts];
          });
          currentFeed.items = _.flatten([newItems, currentFeed.items]);
        })
        .catch(() => {
          state.error = 'network_error';
          state.currentState = 'fail';
        });
    });
    Promise.all(promises)
      .then(setTimeout(() => updateRssFeedsContinuously(state, timeout), timeout));
  };
  setTimeout(() => updateRssFeedsContinuously(state, updateInterval), updateInterval);
};
