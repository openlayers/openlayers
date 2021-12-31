import assert from 'assert';
import frontMatter from 'front-matter';
import fs from 'fs';
import fse from 'fs-extra';
import handlebars from 'handlebars';
import path, {dirname} from 'path';
import sources from 'webpack-sources';
import {fileURLToPath} from 'url';
import {marked} from 'marked';

const RawSource = sources.RawSource;
const baseDir = dirname(fileURLToPath(import.meta.url));

const isCssRegEx = /\.css(\?.*)?$/;
const isJsRegEx = /\.js(\?.*)?$/;
const importRegEx = /(?:^|\n)import .* from '(.*)';(?:\n|$)/g;
const isTemplateJs =
  /\/(jquery(-\d+\.\d+\.\d+)?|(bootstrap(\.bundle)?))(\.min)?\.js(\?.*)?$/;
const isTemplateCss = /\/bootstrap(\.min)?\.css(\?.*)?$/;

const exampleDirContents = fs
  .readdirSync(path.join(baseDir, '..'))
  .filter((name) => /^(?!index).*\.html$/.test(name))
  .map((name) => name.replace(/\.html$/, ''));

let cachedPackageInfo = null;
async function getPackageInfo() {
  if (cachedPackageInfo) {
    return cachedPackageInfo;
  }
  cachedPackageInfo = await fse.readJSON(
    path.resolve(baseDir, '../../package.json')
  );
  return cachedPackageInfo;
}

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
 * Gets dependencies from the js source.
 * @param {string} jsSource Source.
 * @param {Object} pkg Package info.
 * @return {Object<string, string>} dependencies
 */
function getDependencies(jsSource, pkg) {
  const dependencies = {
    ol: pkg.version,
  };

  let importMatch;
  while ((importMatch = importRegEx.exec(jsSource))) {
    const imp = importMatch[1];
    if (!imp.startsWith('ol/') && imp != 'ol') {
      const parts = imp.split('/');
      const dep = imp.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
      if (dep in pkg.devDependencies) {
        dependencies[dep] = pkg.devDependencies[dep];
      }
    }
  }
  return dependencies;
}

export default class ExampleBuilder {
  /**
   * A webpack plugin that builds the html files for our examples.
   * @param {Object} config Plugin configuration.  Requires a `templates` property
   * with the path to templates and a `common` property with the name of the
   * common chunk.
   */
  constructor(config) {
    this.name = 'ExampleBuilder';
    this.templates = config.templates;
    this.common = config.common;
  }

  /**
   * Called by webpack.
   * @param {Object} compiler The webpack compiler.
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation) => {
      compilation.hooks.additionalAssets.tapPromise(this.name, async () => {
        await this.addAssets(compilation.assets, compiler.context);
      });
    });
  }

  async addAssets(assets, dir) {
    const jsAssetRE = /^[\w-]+\.js$/;
    const names = [];
    for (const filename in assets) {
      if (!jsAssetRE.test(filename)) {
        continue;
      }

      const name = filename.replace(/\.js$/, '');
      if (!exampleDirContents.includes(name)) {
        continue;
      }

      names.push(name);
    }

    if (names.length === 0) {
      return;
    }

    const exampleData = await Promise.all(
      names.map(async (name) => await this.parseExample(dir, name))
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
        const newAssets = await this.render(data);
        for (const file in newAssets) {
          assets[file] = new RawSource(newAssets[file]);
        }
      })
    );

    const indexSource = `const info = ${JSON.stringify(info)};`;
    assets['examples-info.js'] = new RawSource(indexSource);
  }

  async parseExample(dir, name) {
    const htmlName = `${name}.html`;
    const htmlPath = path.join(dir, htmlName);
    const htmlSource = await fse.readFile(htmlPath, {encoding: 'utf8'});

    const jsName = `${name}.js`;
    const jsPath = path.join(dir, jsName);
    const jsSource = await fse.readFile(jsPath, {encoding: 'utf8'});

    const {attributes, body} = frontMatter(htmlSource);
    assert(!!attributes.layout, `missing layout in ${htmlPath}`);
    const data = Object.assign(attributes, {contents: body});

    const pkg = await getPackageInfo();
    data.olVersion = pkg.version;
    data.filename = htmlName;
    data.dir = dir;
    data.name = name;
    data.jsSource = jsSource;

    // process tags
    data.tags = data.tags ? data.tags.replace(/[\s"]+/g, '').split(',') : [];
    return data;
  }

  transformJsSource(source) {
    return (
      source
        // remove "../src/" prefix and ".js" to have the same import syntax as the documentation
        .replace(/'\.\.\/src\//g, "'")
        .replace(/\.js';/g, "';")
        // Remove worker loader import and modify `new Worker()` to add source
        .replace(/import Worker from 'worker-loader![^\n]*\n/g, '')
        .replace('new Worker()', "new Worker('./worker.js', {type: 'module'})")
    );
  }

  cloakSource(source, cloak) {
    if (cloak) {
      for (const entry of cloak) {
        source = source.replace(new RegExp(entry.key, 'g'), entry.value);
      }
    }
    return source;
  }

  async render(data) {
    const assets = {};
    const readOptions = {encoding: 'utf8'};

    // add in script tag
    const jsName = `${data.name}.js`;
    const jsSource = this.transformJsSource(
      this.cloakSource(data.jsSource, data.cloak)
    );
    data.js = {
      tag: `<script src="${this.common}.js"></script>
        <script src="${jsName}"></script>`,
      source: jsSource,
    };

    let jsSources = jsSource;
    if (data.sources) {
      data.extraSources = await Promise.all(
        data.sources.map(async (sourceConfig) => {
          const fileName = sourceConfig.path;
          const extraSourcePath = path.join(data.dir, fileName);
          let source = await fse.readFile(extraSourcePath, readOptions);
          let ext = fileName.match(/\.(\w+)$/)[1];
          if (ext === 'mjs') {
            ext = 'js';
          }
          if (ext === 'js') {
            source = this.transformJsSource(source);
            jsSources += '\n' + source;
          }
          source = this.cloakSource(source, data.cloak);
          assets[fileName] = source;
          return {
            name: sourceConfig.as || fileName,
            source: source,
            type: ext,
          };
        })
      );
    }

    const pkg = await getPackageInfo();
    data.pkgJson = JSON.stringify(
      {
        name: data.name,
        dependencies: getDependencies(jsSources, pkg),
        devDependencies: {
          parcel: '^2.0.0',
        },
        scripts: {
          start: 'parcel index.html',
          build: 'parcel build --public-url . index.html',
        },
      },
      null,
      2
    );

    // check for example css
    const cssName = `${data.name}.css`;
    const cssPath = path.join(data.dir, cssName);
    let cssSource;
    try {
      cssSource = await fse.readFile(cssPath, readOptions);
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
      const pkg = await getPackageInfo();
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
    const templateSource = await fse.readFile(templatePath, readOptions);

    assets[data.filename] = handlebars.compile(templateSource)(data);
    return assets;
  }
}
