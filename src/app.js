import _, { uniqueId } from 'lodash';
import axios from 'axios';
import parseRssFeed from './parser.js';
import validateString from './validator.js';

export default (state) => {
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
              feed.items.forEach((item) => {
                const id = uniqueId();
                item.id = id;
                const post = { id, wasOpened: false };
                state.uiState.posts = { post, ...state.uiState.posts };
              });
              state.feeds = [feed, ...state.feeds];
            } catch (error) {
              state.message = 'rss_invalid';
              state.currentState = 'invalidRss';
            }
          })
          .catch(() => {
            state.message = 'network_error';
            state.currentState = 'failedRequest';
          });
      } else {
        state.message = 'rss_duplicate';
        state.currentState = 'invalidInput';
      }
    } catch (error) {
      state.inputForm.error = 'url_invalid';
      state.currentState = 'invalidInput';
    }
  };
  const addButton = document.querySelector('button[type="submit"]');
  addButton.onclick = handleAddClick;

  const updateRssFeedsContinuously = (watchedstate, timeout) => {
    if (!_.isEmpty(watchedstate.feeds)) {
      const promises = watchedstate.feeds.map((currentFeed) => {
        retrieveFeed(currentFeed.url, currentProxy)
          .then((response) => {
            const feed = parseRssFeed(response.data.contents);
            currentFeed.items = _.uniqWith([...feed.items, ...currentFeed.items], _.isEqual);
            const newItems = currentFeed.items.filter((item) => !item.id);
            newItems.forEach((item) => {
              const id = uniqueId();
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
