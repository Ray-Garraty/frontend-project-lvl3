import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';

const stringIsValidUrl = (string) => {
  yup.setLocale({
    url: {
      default: ({ userString }) => ({ key: 'url_invalid', values: { userString } }),
    },
  });
  const schema = yup.string().url();
  return schema.validate(string).catch((error) => error.errors.forEach((err) => {
    console.error(i18next.t(err));
  }));
};

const isUrlAlreadyLoaded = (urlToVerify, state) => !_.isEmpty(state.feeds
  .filter((feed) => feed.url === urlToVerify));

export { stringIsValidUrl, isUrlAlreadyLoaded };
