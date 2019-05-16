const build = require('../../tasks/serialize-workers').build;

function loader() {
  const callback = this.async();

  let minify = false;

  // TODO: remove when https://github.com/webpack/webpack/issues/6496 is addressed
  const compilation = this._compilation;
  if (compilation) {
    minify = compilation.compiler.options.mode === 'production';
  }

  build(this.resource, {minify})
    .then(chunk => {
      for (const filePath in chunk.modules) {
        this.addDependency(filePath);
      }
      callback(null, chunk.code);
    })
    .catch(callback);
}

module.exports = loader;
