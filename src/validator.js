import * as yup from 'yup';

export default (url, urlsList, schema1) => {
  schema1.validateSync(url);
  const schema2 = yup.mixed().notOneOf(urlsList);
  schema2.validateSync(url);
};
