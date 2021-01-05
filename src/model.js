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
      // отрисовываем ошибки
        render(state);
      } else {
        // запрашиваем rss-файл, парсим его и отрисовываем
        axios
          .get(`https://api.allorigins.win/get?url=${encodeURIComponent(state.inputForm.content)}`)
          .then((response) => {
            const { feed, posts } = parseRssFeed(response.data.contents);
            if (isEmpty(feed)) {
              onChange.target(state).inputForm.error = "This source doesn't contain valid rss";
              state.inputForm.isValid(false);
            } else {
              onChange.target(state).feeds = [...state.feeds, feed];
              onChange.target(state).posts = [...state.posts, posts];
              state.currentState = 'processed';
              render(state);
            }
          })
          .catch(() => {
            state.inputForm.error = 'Network Error';
          });
      }
    }
  });
  return watchedState;
};
