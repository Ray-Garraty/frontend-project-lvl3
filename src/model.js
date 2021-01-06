import axios from 'axios';
import onChange from 'on-change';
import { isEmpty } from 'lodash';
import render from './view.js';
import parseRssFeed from './parser.js';

export default () => {
  const state = {
    // текущие состояния: idle, sending, processed, error
    currentState: 'idle',
    inputForm: {
      isValid: false,
      content: '',
      error: '',
    },
    feeds: [],
    posts: [],
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
          .get(`https://api.allorigins.win/get?url=${encodeURIComponent(state.inputForm.content)}`)
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
