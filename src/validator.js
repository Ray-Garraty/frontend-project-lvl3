import * as yup from 'yup';
import _ from 'lodash';

/* асинхронная функция stringIsValidUrl - принимает строку
и при помощи библиотеки yup проверяет, является ли она валидным url-адресом */
const stringIsValidUrl = (string) => {
  const schema = yup.string().url();
  return schema.isValid(string);
};

const isUrlAlreadyLoaded = (urlToVerify, state) => !_.isEmpty(state.feeds
  .filter((feed) => feed.url === urlToVerify));

export { stringIsValidUrl, isUrlAlreadyLoaded };
