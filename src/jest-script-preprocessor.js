import babelJest from 'babel-jest';

module.exports = {
  process(src, filename) {
    return babelJest.process(src, filename)
      .replace(/^require.*\.css.*;$/gm, '');
  },
};
