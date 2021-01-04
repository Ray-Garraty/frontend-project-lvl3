import axios from 'axios';
import onChange from 'on-change';
import render from './view.js';
import parseRssFeed from './parser.js';

const state = {
  inputForm: {
    isValid: false,
    content: '',
    error: '',
  },
  feeds: [],
  posts: [],
};

const watchedState = onChange(state, (path, value) => {
  if (path === 'inputForm.isValid') {
    if (!value) {
    // отрисовываем ошибки
      render(state);
    } else {
      // запрашиваем rss-файл, парсим его и отрисовываем
      axios
        .get(state.inputForm.content)
        .then((response) => {
          const { feed, posts } = parseRssFeed(response.data);
          state.feeds = [...state.feeds, feed];
          state.posts = [...state.posts, posts];
          render(state);
        })
        .catch(console.error);
    }
  }
});

export { watchedState, parseRssFeed };

/* axios.get('http://lorem-rss.herokuapp.com/feed')
  .then((response) => {
    const domparser = new DOMParser();
    const doc = domparser.parseFromString(response.data, 'application/xml');
    const document = doc.documentElement.childNodes[0];
    const items = document.querySelectorAll('channel > item');
    console.dir(items);
    // fs.writeFileSync('test.htm', doc.documentElement.innerHTML, 'utf-8');
    // console.log(doc.rss.channel[0].item);
  })
  .catch(console.error); */

// тут можно посмотреть, что именно выдаёт функция parseRssFeed:
/* axios.get('https://lorem-rss.herokuapp.com/feed')
  .then((response) => {
    const result = parseRssFeed(response.data);
    console.log(result);
}); */
