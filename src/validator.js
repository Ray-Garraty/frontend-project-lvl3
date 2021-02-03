import * as yup from 'yup';

export default () => {
  const schema = yup.string().url().required();
  return (url, urlsList) => {
    try {
      schema.notOneOf(urlsList).validateSync(url);
      return null;
    } catch (error) {
      return error;
    }
  };
};
