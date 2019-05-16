const build = require('../../tasks/serialize-workers').build;

function loader() {
  const callback = this.async();

  build(this.resource, {minify: false})
    .then(chunk => {
      for (const filePath in chunk.modules) {
        this.addDependency(filePath);
      }
      callback(null, chunk.code);
    })
    .catch(callback);
}

module.exports = loader;
