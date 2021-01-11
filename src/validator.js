import * as yup from 'yup';

const stringIsValidUrl = (string) => {
  const schema = yup.string().url();
  try {
    schema.validateSync(string);
    return true;
  } catch (error) {
    return false;
  }
};

const isUrlAlreadyLoaded = (url, feeds) => {
  const feedsUrls = feeds.map((feed) => feed.url);
  const schema = yup.mixed().oneOf(feedsUrls);
  return schema.isValidSync(url);
};

export { stringIsValidUrl, isUrlAlreadyLoaded };
