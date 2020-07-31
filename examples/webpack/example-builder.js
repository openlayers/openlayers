const assert = require('assert');
const frontMatter = require('front-matter');
const fs = require('fs');
const handlebars = require('handlebars');
const marked = require('marked');
const path = require('path');
const pkg = require('../../package.json');
const promisify = require('util').promisify;
const RawSource = require('webpack-sources').RawSource;

const readFile = promisify(fs.readFile);
const isCssRegEx = /\.css(\?.*)?$/;
const isJsRegEx = /\.js(\?.*)?$/;
const importRegEx = /^import .* from '(.*)';$/;
const isTemplateJs = /\/(jquery(-\d+\.\d+\.\d+)?|(bootstrap(\.bundle)?))(\.min)?\.js(\?.*)?$/;
const isTemplateCss = /\/bootstrap(\.min)?\.css(\?.*)?$/;

handlebars.registerHelper(
  'md',
  (str) => new handlebars.SafeString(marked(str))
);

/**
 * Used to doube-escape the title when stored as data-* attribute.
 */
handlebars.registerHelper('escape', (text) => {
  return handlebars.Utils.escapeExpression(text);
});

handlebars.registerHelper('indent', (text, options) => {
  if (!text) {
    return text;
  }
  const count = options.hash.spaces || 2;
  const spaces = new Array(count + 1).join(' ');
  return text
    .split('\n')
    .map((line) => (line ? spaces + line : ''))
    .join('\n');
});

/**
 * Returns the object with the keys inserted in alphabetic order.
 * When exporting with `JSON.stringify(obj)` the keys are sorted.
 * @param {Object<string, *>} obj Any object
 * @return {Object<string, *>} New object
 */
function sortObjectByKey(obj) {
  return Object.keys(obj)
    .sort() // sort twice to get predictable, case insensitve order
    .sort((a, b) => a.localeCompare(b, 'en', {sensitivity: 'base'}))
    .reduce((idx, tag) => {
      idx[tag] = obj[tag];
      return idx;
    }, {});
}

/**
 * Create an index of tags belonging to examples
 * @param {Array<Object>} exampleData Array of example data objects.
 * @return {Object} Word index.
 */
function createTagIndex(exampleData) {
  const index = {};
  exampleData.forEach((data, i) => {
    data.tags.forEach((tag) => {
      tag = tag.toLowerCase();
      let tagIndex = index[tag];
      if (!tagIndex) {
        tagIndex = [];
        index[tag] = tagIndex;
      }
      tagIndex.push(i);
    });
  });
  return index;
}

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
    keys.forEach((key) => {
      let text = data[key] || '';
      if (Array.isArray(text)) {
        text = text.join(' ');
      }
      const words = text.toLowerCase().split(/\W+/);
      words.forEach((word) => {
        if (word) {
          let counts = index[word];
          if (!counts) {
            counts = {};
            index[word] = counts;
          }
          counts[i] = (counts[i] || 0) + 1;
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
    ol: pkg.version,
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

class ExampleBuilder {
  /**
   * A webpack plugin that builds the html files for our examples.
   * @param {Object} config Plugin configuration.  Requires a `templates` property
   * with the path to templates and a `common` property with the name of the
   * common chunk.
   */
  constructor(config) {
    this.templates = config.templates;
    this.common = config.common;
  }

  /**
   * Called by webpack.
   * @param {Object} compiler The webpack compiler.
   */
  apply(compiler) {
    compiler.hooks.emit.tapPromise('ExampleBuilder', async (compilation) => {
      const chunks = compilation
        .getStats()
        .toJson()
        .chunks.filter((chunk) => chunk.names[0] !== this.common);

      const exampleData = [];
      await Promise.all(
        chunks.map(async (chunk) => {
          const data = await this.readHtml(compiler.context, chunk);
          exampleData.push(data);
        })
      );
      const examples = exampleData.map((data) => {
        return {
          link: data.filename,
          title: data.title,
          shortdesc: data.shortdesc,
          tags: data.tags,
        };
      });

      examples.sort((a, b) =>
        a.title.localeCompare(b.title, 'en', {sensitivity: 'base'})
      );
      const tagIndex = createTagIndex(examples);
      const info = {
        examples: examples,
        // Tags for main page... TODO: implement index tag links
        // tagIndex: sortObjectByKey(tagIndex),
        wordIndex: sortObjectByKey(createWordIndex(examples)),
      };
      exampleData.forEach((data) => {
        data.tags = data.tags.map((tag) => {
          const tagExamples = tagIndex[tag.toLowerCase()];
          return {
            tag: tag,
            examples: tagExamples.map((exampleIdx) => {
              const example = examples[exampleIdx];
              return {
                link: example.link,
                title: example.title,
                isCurrent: data.filename === example.link,
              };
            }),
          };
        });
      });

      await Promise.all(
        exampleData.map(async (data) => {
          const assets = await this.render(data, data.chunk);
          for (const file in assets) {
            compilation.assets[file] = new RawSource(assets[file]);
          }
        })
      );
      const indexSource = `const info = ${JSON.stringify(info)};`;
      compilation.assets['examples-info.js'] = new RawSource(indexSource);
    });
  }

  async readHtml(dir, chunk) {
    const name = chunk.names[0];
    const htmlName = `${name}.html`;
    const htmlPath = path.join(dir, htmlName);
    const htmlSource = await readFile(htmlPath, {encoding: 'utf8'});

    const {attributes, body} = frontMatter(htmlSource);
    assert(!!attributes.layout, `missing layout in ${htmlPath}`);
    const data = Object.assign(attributes, {contents: body});

    data.olVersion = pkg.version;
    data.filename = htmlName;
    data.dir = dir;
    data.chunk = chunk;

    // process tags
    if (data.tags) {
      data.tags = data.tags.replace(/[\s"]+/g, '').split(',');
    } else {
      data.tags = [];
    }
    return data;
  }

  async render(data, chunk) {
    const name = chunk.names[0];

    const assets = {};
    const readOptions = {encoding: 'utf8'};

    // add in script tag
    const jsName = `${name}.js`;
    let jsSource = getJsSource(chunk, path.join('.', jsName));
    if (!jsSource) {
      throw new Error(`No .js source for ${jsName}`);
    }
    // remove "../src/" prefix and ".js" to have the same import syntax as the documentation
    jsSource = jsSource.replace(/'\.\.\/src\//g, "'");
    jsSource = jsSource.replace(/\.js';/g, "';");
    if (data.cloak) {
      for (const entry of data.cloak) {
        jsSource = jsSource.replace(new RegExp(entry.key, 'g'), entry.value);
      }
    }
    // Remove worker loader import and modify `new Worker()` to add source
    jsSource = jsSource.replace(
      /import Worker from 'worker-loader![^\n]*\n/g,
      ''
    );
    jsSource = jsSource.replace('new Worker()', "new Worker('./worker.js')");

    data.js = {
      tag: `<script src="${this.common}.js"></script>
        <script src="${jsName}"></script>`,
      source: jsSource,
    };

    // check for worker js
    const workerName = `${name}.worker.js`;
    const workerPath = path.join(data.dir, workerName);
    let workerSource;
    try {
      workerSource = await readFile(workerPath, readOptions);
    } catch (err) {
      // pass
    }
    if (workerSource) {
      // remove "../src/" prefix and ".js" to have the same import syntax as the documentation
      workerSource = workerSource.replace(/'\.\.\/src\//g, "'");
      workerSource = workerSource.replace(/\.js';/g, "';");
      if (data.cloak) {
        for (const entry of data.cloak) {
          workerSource = workerSource.replace(
            new RegExp(entry.key, 'g'),
            entry.value
          );
        }
      }
      data.worker = {
        source: workerSource,
      };
      assets[workerName] = workerSource;
    }

    data.pkgJson = JSON.stringify(
      {
        name: name,
        dependencies: getDependencies(
          jsSource + (workerSource ? `\n${workerSource}` : '')
        ),
        devDependencies: {
          parcel: '1.11.0',
        },
        scripts: {
          start: 'parcel index.html',
          build:
            'parcel build --experimental-scope-hoisting --public-url . index.html',
        },
      },
      null,
      2
    );

    // check for example css
    const cssName = `${name}.css`;
    const cssPath = path.join(data.dir, cssName);
    let cssSource;
    try {
      cssSource = await readFile(cssPath, readOptions);
    } catch (err) {
      // pass
    }
    if (cssSource) {
      data.css = {
        tag: `<link rel="stylesheet" href="${cssName}">`,
        source: cssSource,
      };
      assets[cssName] = cssSource;
    }

    // add additional resources
    if (data.resources) {
      const localResources = [];
      const remoteResources = [];
      data.resources.forEach((resource) => {
        const remoteResource = /^https?:\/\//.test(resource)
          ? resource
          : `https://openlayers.org/en/v${pkg.version}/examples/${resource}`;
        if (isJsRegEx.test(resource)) {
          if (!isTemplateJs.test(resource)) {
            localResources.push(`<script src="${resource}"></script>`);
          }
          remoteResources.push(`<script src="${remoteResource}"></script>`);
        } else if (isCssRegEx.test(resource)) {
          if (!isTemplateCss.test(resource)) {
            localResources.push(`<link rel="stylesheet" href="${resource}">`);
          }
          remoteResources.push(
            `<link rel="stylesheet" href="${remoteResource}">`
          );
        } else {
          throw new Error(
            `Invalid resource: '${resource}' is not .js or .css: ${data.filename}`
          );
        }
      });
      data.extraHead = {
        local: localResources.join('\n'),
        remote: remoteResources.join('\n'),
      };
    }

    const templatePath = path.join(this.templates, data.layout);
    const templateSource = await readFile(templatePath, readOptions);

    assets[data.filename] = handlebars.compile(templateSource)(data);
    return assets;
  }
}

module.exports = ExampleBuilder;
