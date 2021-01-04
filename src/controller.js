import axios from 'axios';
import { watchedState, parseRssFeed } from './model.js';
import { stringIsValidUrl, urlIsAlreadyLoaded } from './validator.js';

/* обработчик, который по нажатию на кнопку "Add" выполняет следующее:
- вызывает функции проверки на валидность stringIsValidUrl и дублируемость urlIsAlreadyLoaded;
- меняет состояние state.inputForm.isValid в зависимости от результатов проверки;
- если адрес валидный, то выполняется запрос и скачивается rss-файл,
вызывается функция для его парсинга parseRssFile, извлекаются посты
и записываются в состояние state.feeds */

export default () => {
  const button = document.querySelector('button[type="submit"]');
  const inputForm = document.querySelector('input');
  const handleClick = () => {
    const userString = inputForm.value;
    stringIsValidUrl(userString)
      .then((isValid) => {
        if (isValid) {
          if (urlIsAlreadyLoaded(userString)) {
            watchedState.inputForm.error = 'Rss already exists';
          } else {
            watchedState.inputForm.isValid = true;
            watchedState.inputForm.content = inputForm.value;
            axios
              .get(userString)
              .then((response) => {
                watchedState.feeds.push(userString);
                const posts = parseRssFeed(response.data);
                watchedState.posts = [...watchedState.posts, ...posts];
              })
              .catch(() => {
                watchedState.inputForm.error = "This source doesn't contain valid rss";
              });
          }
        } else {
          watchedState.inputForm.isValid = false;
          watchedState.inputForm.error = 'Must be valid url';
        }
      });
  };
  button.onclick = handleClick;
};
