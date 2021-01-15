/* eslint-disable no-param-reassign */
import _ from 'lodash';
import axios from 'axios';
import parseRssFeed from './parser.js';
import validateString from './validator.js';
import generateState from './watchers.js';

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

  const state = generateState(pageElements);

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
    state.message = '';
    state.inputForm.error = '';
    state.inputForm.content = inputForm.value;
    const feedsUrls = state.feeds.flatMap((feed) => feed.url);
    try {
      if (validateString(state.inputForm.content, feedsUrls)) {
        state.currentState = 'sending';
        retrieveFeed(state.inputForm.content, currentProxy)
          .then((response) => {
            try {
              const feed = parseRssFeed(response.data.contents);
              state.message = 'rss_loaded';
              state.currentState = 'success';
              feed.url = state.inputForm.content;
              state.inputForm.content = '';
              feed.id = _.uniqueId();
              state.uiState.posts = feed.items.map((item) => {
                const id = _.uniqueId();
                item.id = id;
                return { id, wasOpened: false };
              });
              state.feeds = [feed, ...state.feeds];
            } catch (error) {
              // console.log('1', error);
              state.message = 'rss_invalid';
              state.currentState = 'invalidRss';
            }
          })
          .catch(() => {
            // console.error('2', error);
            state.message = 'network_error';
            state.currentState = 'failedRequest';
          });
      } else {
        state.inputForm.error = 'rss_duplicate';
        state.currentState = 'invalidInput';
      }
    } catch (error) {
      // console.error('3', error);
      state.inputForm.error = 'url_invalid';
      state.currentState = 'invalidInput';
    }
  };
  addButtonElement.onclick = handleAddClick;

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
  const interval = 5000;
  setTimeout(() => updateRssFeedsContinuously(state, interval), interval);
};
