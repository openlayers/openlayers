/* eslint-disable import/no-commonjs */

const build = require('../../tasks/serialize-workers.cjs').build;

module.exports = function loader() {
  const callback = this.async();
  const minify = this.mode === 'production';

  build(this.resource, {minify})
    .then((chunk) => {
      for (const filePath in chunk.modules) {
        try {
          const dependency = require.resolve(filePath);
          this.addDependency(dependency);
        } catch (e) {
          // empty catch block
        }
      }
      callback(null, chunk.code);
    })
    .catch(callback);
};
