import onChange from 'on-change';
import updateRssFeedsContinuously from './updater';

export default () => {
  // задаём функции render по каждому семантическому блоку
  const renderInputForm = (isFormValid, message) => {
    // отрисовка цвета рамки в зависимости от isFormValid,
    // отрисовка message
  };

  const renderFeedLoadingProcess = (isButtonDisabled) => {
    // активация/деактивация кнопки 'Add' в зависимости от параметра
  };

  const renderFeeds = (feeds) => {
    // отрисовка фидов
  };

  const renderPosts = (posts) => {
    // отрисовка постов
  };

  const renderViewedPosts = (posts, ids) => {
    // выборка постов по id и снятие жирного шрифта с их заголовков
  };

  // задаём начальный state
  const state = {
    currentState: 'idle',
    inputForm: {
      isValid: false,
      content: '',
      error: '',
    },
    message: '',
    feeds: [],
    viewedPostsIds: [],
  };

  // задаём watchedState
  const watchedState = onChange(state, (path, value) => {
    if (path === 'currentState') {
      switch (value) {
        case 'invalidInput':
          renderInputForm(false, state.inputForm.error);
          break;
        case 'sending':
          renderFeedLoadingProcess(true);
          break;
        case 'invalidRss':
        case 'failedRequest':
          renderFeedLoadingProcess(false);
          renderInputForm(true, state.message);
          break;
        case 'success':
          renderFeedLoadingProcess(false);
          renderInputForm(true, state.message);
          renderFeeds(state.feeds);
          // eslint-disable-next-line no-case-declarations
          const posts = state.feeds.flatMap((feed) => feed.items);
          renderPosts(posts);
          break;
        default:
          console.log('Unexpected currentState: ', value);
          break;
      }
    }
    if (path === 'feeds') {
      renderFeeds(state.feeds);
      // eslint-disable-next-line no-case-declarations
      const posts = state.feeds.flatMap((feed) => feed.items);
      renderPosts(posts);
    }
    if (path === 'viewedPostsIds') {
      const posts = state.feeds.flatMap((feed) => feed.items);
      renderViewedPosts(posts, value);
    }
  });
  // задаём обработчики кнопок

  // задаём обработчик updateRssFeedsContinuously
  const interval = 5000;
  setTimeout(updateRssFeedsContinuously, interval, watchedState, interval);
};
