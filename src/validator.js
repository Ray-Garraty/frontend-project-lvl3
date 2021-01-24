import * as yup from 'yup';

export default () => {
  const schema = yup.string().url().required();
  return (url, urlsList) => schema.notOneOf(urlsList).validateSync(url);
};
