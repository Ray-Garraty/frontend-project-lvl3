import _ from 'lodash';
import axios from 'axios';
import onChange from 'on-change';
import render from './view.js';
import parseRssFeed from './parser.js';
import { proxies } from './model.js';

const updateRssFeeds = (state) => {
  state.feeds.forEach((currentFeed) => {
    axios
      .get(`${proxies.allorigins}${encodeURIComponent(currentFeed.url)}`)
      .then((response) => {
        const parsedData = parseRssFeed(response.data.contents);
        const { posts } = parsedData;
        onChange.target(state).posts = _.uniqWith([...posts, ...state.posts], _.isEqual);
        render(state);
      })
      .catch((error) => {
        console.error(error);
      });
  });
};

const updateRssFeedsContinuously = (state, interval) => {
  updateRssFeeds(state);
  setTimeout(updateRssFeedsContinuously, interval, state, interval);
};

export default updateRssFeedsContinuously;
