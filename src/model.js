import axios from 'axios';
import onChange from 'on-change';
import { isEmpty } from 'lodash';
import render from './view.js';
import parseRssFeed from './parser.js';

export const proxies = {
  none: '', // выдаёт ошибку: "Cross-Origin Request Blocked"
  allorigins: 'https://api.allorigins.win/get?url=', // выдаёт не самую новую версию rss-потока
  heroku: 'https://cors-anywhere.herokuapp.com/', // выдаёт ошибку "XML Parsing Error: syntax error"
  htmldriven: 'https://cors-proxy.htmldriven.com/?url=', // выдаёт ошибку: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://cors-proxy.htmldriven.com/?url=https%3A%2F%2Florem-rss.herokuapp.com%2Ffeed. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing)"
  thingproxy: 'https://thingproxy.freeboard.io/fetch/', // выдаёт ошибку "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://thingproxy.freeboard.io/fetch/https%3A%2F%2Florem-rss.herokuapp.com%2Ffeed. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing)"
  whateverorigin: 'http://www.whateverorigin.org/get?url=', // выдаёт ошибку "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://www.whateverorigin.org/get?url=https%3A%2F%2Florem-rss.herokuapp.com%2Ffeed. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing)"
  alloworigin: 'http://alloworigin.com/get?url=', // выдаёт ошибку "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://www.whateverorigin.org/get?url=https%3A%2F%2Florem-rss.herokuapp.com%2Ffeed. (Reason: CORS header ‘Access-Control-Allow-Origin’ missing)"
  yacdn: 'https://yacdn.org/serve/', // запрос отправляет, но ответа нет... :-(
};

export default () => {
  const state = {
    currentState: 'idle',
    inputForm: {
      isValid: false,
      content: '',
      error: '',
    },
    feeds: [],
    posts: [],
    viewedPostsIds: [],
  };
  const watchedState = onChange(state, (path, value) => {
    if (path === 'inputForm.error') {
      render(state);
    }
    if (path === 'inputForm.isValid') {
      if (!value) {
        render(state);
      } else {
        axios
          .get(`${proxies.allorigins}${encodeURIComponent(state.inputForm.content)}`)
          .then((response) => {
            const parsedData = parseRssFeed(response.data.contents);
            const { feed, posts } = parsedData;
            if (isEmpty(feed)) {
              onChange.target(state).inputForm.error = 'rss_invalid';
              onChange.target(state).currentState = 'error';
              render(state);
            } else {
              feed.url = state.inputForm.content;
              onChange.target(state).inputForm.content = '';
              onChange.target(state).feeds = [feed, ...state.feeds];
              onChange.target(state).posts = [...posts, ...state.posts];
              onChange.target(state).currentState = 'processed';
              render(state);
              onChange.target(state).inputForm.isValid = false;
            }
          })
          .catch((error) => {
            console.error(error);
            onChange.target(state).inputForm.error = 'network_error';
            render(state);
          });
      }
    }
  });
  return watchedState;
};
