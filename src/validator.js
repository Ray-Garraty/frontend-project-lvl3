import * as yup from 'yup';

/* асинхронная функция stringIsValidUrl - принимает строку
и при помощи библиотеки yup проверяет, является ли она валидным url-адресом */
const stringIsValidUrl = (string) => {
  const schema = yup.string().url();
  return schema.isValid(string);
};

const urlIsAlreadyLoaded = (string, state) => {
  const url = new URL(string);
  return state.feeds.includes(url);
};

export { stringIsValidUrl, urlIsAlreadyLoaded };
