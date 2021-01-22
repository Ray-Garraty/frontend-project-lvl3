import * as yup from 'yup';

export default () => {
  const schema = yup.string().url();
  return (url, urlsList) => schema.notOneOf(urlsList).validateSync(url);
};
