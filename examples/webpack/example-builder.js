const frontMatter = require('front-matter');
const fs = require('fs');
const handlebars = require('handlebars');
const marked = require('marked');
const path = require('path');
const pkg = require('../../package.json');
const promisify = require('util').promisify;
const RawSource = require('webpack-sources').RawSource;

const readFile = promisify(fs.readFile);
const isCssRegEx = /\.css$/;
const isJsRegEx = /\.js(\?.*)?$/;
const importRegEx = /^import .* from '(.*)';$/;

handlebars.registerHelper('md', str => new handlebars.SafeString(marked(str)));

handlebars.registerHelper('indent', (text, options) => {
  if (!text) {
    return text;
  }
  const count = options.hash.spaces || 2;
  const spaces = new Array(count + 1).join(' ');
  return text.split('\n').map(line => line ? spaces + line : '').join('\n');
});

/**
 * Create an inverted index of keywords from examples.  Property names are
 * lowercased words.  Property values are objects mapping example index to word
 * count.
 * @param {Array<Object>} exampleData Array of example data objects.
 * @return {Object} Word index.
 */
function createWordIndex(exampleData) {
  const index = {};
  const keys = ['shortdesc', 'title', 'tags'];
  exampleData.forEach((data, i) => {
    keys.forEach(key => {
      let text = data[key];
      if (Array.isArray(text)) {
        text = text.join(' ');
      }
      const words = text ? text.split(/\W+/) : [];
      words.forEach(word => {
        if (word) {
          word = word.toLowerCase();
          let counts = index[word];
          if (counts) {
            if (index in counts) {
              counts[i] += 1;
            } else {
              counts[i] = 1;
            }
          } else {
            counts = {};
            counts[i] = 1;
            index[word] = counts;
          }
        }
      });
    });
  });
  return index;
}

/**
 * Gets the source for the chunk that matches the jsPath
 * @param {Object} chunk Chunk.
 * @param {string} jsName Name of the file.
 * @return {string} The source.
 */
function getJsSource(chunk, jsName) {
  let jsSource;
  for (let i = 0, ii = chunk.modules.length; i < ii; ++i) {
    const module = chunk.modules[i];
    if (module.modules) {
      jsSource = getJsSource(module, jsName);
      if (jsSource) {
        return jsSource;
      }
    }
    if (module.identifier.endsWith(jsName) && module.source) {
      return module.source;
    }
  }
}

/**
 * Gets dependencies from the js source.
 * @param {string} jsSource Source.
 * @return {Object<string, string>} dependencies
 */
function getDependencies(jsSource) {
  const lines = jsSource.split('\n');
  const dependencies = {
    ol: pkg.version
  };
  for (let i = 0, ii = lines.length; i < ii; ++i) {
    const line = lines[i];
    const importMatch = line.match(importRegEx);
    if (importMatch) {
      const imp = importMatch[1];
      if (!imp.startsWith('ol/') && imp != 'ol') {
        const parts = imp.split('/');
        let dep;
        if (imp.startsWith('@')) {
          dep = parts.slice(0, 2).join('/');
        } else {
          dep = parts[0];
        }
        if (dep in pkg.devDependencies) {
          dependencies[dep] = pkg.devDependencies[dep];
        }
      }
    }
  }
  return dependencies;
}

/**
 * A webpack plugin that builds the html files for our examples.
 * @param {Object} config Plugin configuration.  Requires a `templates` property
 * with the path to templates and a `common` property with the name of the
 * common chunk.
 * @constructor
 */
function ExampleBuilder(config) {
  this.templates = config.templates;
  this.common = config.common;
}

/**
 * Called by webpack.
 * @param {Object} compiler The webpack compiler.
 */
ExampleBuilder.prototype.apply = function(compiler) {
  compiler.hooks.emit.tapPromise('ExampleBuilder', async (compilation) => {
    const chunks = compilation.getStats().toJson().chunks
      .filter(chunk => chunk.names[0] !== this.common);

    const exampleData = [];
    const promises = chunks.map(async chunk => {
      const [assets, data] = await this.render(compiler.context, chunk);

      exampleData.push({
        link: data.filename,
        example: data.filename,
        title: data.title,
        shortdesc: data.shortdesc,
        tags: data.tags
      });

      for (const file in assets) {
        compilation.assets[file] = new RawSource(assets[file]);
      }
    });

    await Promise.all(promises);

    const info = {
      examples: exampleData,
      index: createWordIndex(exampleData)
    };

    const indexSource = `var info = ${JSON.stringify(info)}`;
    compilation.assets['index.js'] = new RawSource(indexSource);
  });
};

ExampleBuilder.prototype.render = async function(dir, chunk) {
  const name = chunk.names[0];

  const assets = {};
  const readOptions = {encoding: 'utf8'};

  const htmlName = `${name}.html`;
  const htmlPath = path.join(dir, htmlName);
  const htmlSource = await readFile(htmlPath, readOptions);

  const {attributes, body} = frontMatter(htmlSource);
  const data = Object.assign(attributes, {contents: body});

  data.olVersion = pkg.version;
  data.filename = htmlName;

  // add in script tag
  const jsName = `${name}.js`;
  let jsSource = getJsSource(chunk, path.join('.', jsName));
  if (!jsSource) {
    throw new Error(`No .js source for ${jsName}`);
  }
  // remove "../src/" prefix and ".js" to have the same import syntax as the documentation
  jsSource = jsSource.replace(/'\.\.\/src\//g, '\'');
  jsSource = jsSource.replace(/\.js';/g, '\';');
  if (data.cloak) {
    for (const entry of data.cloak) {
      jsSource = jsSource.replace(new RegExp(entry.key, 'g'), entry.value);
    }
  }
  data.js = {
    tag: `<script src="${this.common}.js"></script><script src="${jsName}"></script>`,
    source: jsSource
  };
  data.pkgJson = JSON.stringify({
    name: name,
    dependencies: getDependencies(jsSource),
    devDependencies: {
      parcel: '1.11.0'
    },
    scripts: {
      start: 'parcel index.html',
      build: 'parcel build --experimental-scope-hoisting --public-url . index.html'
    }
  }, null, 2);

  // check for example css
  const cssName = `${name}.css`;
  const cssPath = path.join(dir, cssName);
  let cssSource;
  try {
    cssSource = await readFile(cssPath, readOptions);
  } catch (err) {
    // pass
  }
  if (cssSource) {
    data.css = {
      tag: `<link rel="stylesheet" href="${cssName}">`,
      source: cssSource
    };
    assets[cssName] = cssSource;
  }

  // add additional resources
  if (data.resources) {
    const resources = [];
    const remoteResources = [];
    const codePenResources = [];
    for (let i = 0, ii = data.resources.length; i < ii; ++i) {
      const resource = data.resources[i];
      const remoteResource = resource.indexOf('//') === -1 ?
        `https://openlayers.org/en/v${pkg.version}/examples/${resource}` : resource;
      codePenResources[i] = remoteResource;
      if (isJsRegEx.test(resource)) {
        resources[i] = `<script src="${resource}"></script>`;
        remoteResources[i] = `<script src="${remoteResource}"></script>`;
      } else if (isCssRegEx.test(resource)) {
        if (resource.indexOf('bootstrap.min.css') === -1) {
          resources[i] = '<link rel="stylesheet" href="' + resource + '">';
        }
        remoteResources[i] = '<link rel="stylesheet" href="' +
            remoteResource + '">';
      } else {
        throw new Error('Invalid value for resource: ' +
            resource + ' is not .js or .css: ' + htmlName);
      }
    }
    data.extraHead = {
      local: resources.join('\n'),
      remote: remoteResources.join('\n')
    };
    data.extraResources = data.resources.length ?
      ',' + codePenResources.join(',') : '';
  }

  const templatePath = path.join(this.templates, attributes.layout);
  const templateSource = await readFile(templatePath, readOptions);

  assets[htmlName] = handlebars.compile(templateSource)(data);
  return [assets, data];
};

module.exports = ExampleBuilder;
