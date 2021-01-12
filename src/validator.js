import * as yup from 'yup';

/* Логика работы: если не проходит первую проверку, то выбрасывается ошибка.
Если проходит первую, но не проходит вторую проверку, то возвращает false.
Если проходит обе проверки, то возвращает true */
export default (url, urlsList) => {
  const schema1 = yup.string().url();
  schema1.validateSync(url);
  const schema2 = yup.mixed().oneOf(urlsList);
  return schema2.isValidSync(url);
};
