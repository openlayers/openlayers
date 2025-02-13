import assert from 'assert';
import fs from 'fs';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import eslint from 'eslint';
import {parse} from 'espree';
import frontMatter from 'front-matter';
import fse from 'fs-extra';
import handlebars from 'handlebars';
import {marked} from 'marked';
import sources from 'webpack-sources';
import flatConfig from '../../eslint.config.js';

/**
 * @typedef {Object} Options
 * @property {string} templates path to templates
 * @property {string} common name of the common chunk.html templates dir
 */

/**
 * @typedef {Object} TemplateConfig
 * @property {string} filename base name of the example's files
 * @property {string} layout html Template name from the template dir
 * @property {string} title text for the html title
 * @property {string} shortdesc Short description for the example list index.html
 * @property {string} [docs] Description under the map
 * @property {Array<string>} tags Tags for this example
 * @property {boolean} [experimental=false] Display a notice about using non-api code
 * @property {Array<string>} [resources] Additional js/css files to include
 * @property {Array<{key: string, value: string}} [cloak] Hide sensitive information / access keys
 */

/**
 * @typedef {Object} PackageJson
 * @property {string} version Package version
 * @property {Object<string, string>} devDependencies Development dependencies
 */

const RawSource = sources.RawSource;
const baseDir = dirname(fileURLToPath(import.meta.url));

const isCssRegEx = /\.css(\?.*)?$/;
const isJsRegEx = /\.js(\?.*)?$/;
const importRegEx = /\s?import (?:.*? from )?'([^']+)'/g;
const isTemplateJs = /\/(?:bootstrap(?:\.bundle)?)(?:\.min)?\.js(?:\?.*)?$/;
const isTemplateCss =
  /\/(?:bootstrap|fontawesome-free@[\d.]+\/css\/(?:fontawesome|brands|solid))(?:\.min)?\.css(?:\?.*)?$/;

const exampleDirContents = fs
  .readdirSync(path.join(baseDir, '..'))
  .filter((name) => /^(?!index).*\.html$/.test(name))
  .map((name) => name.replace(/\.html$/, ''));

/**
 * @return {Promise<PackageJson>} package.json content
 */
function getPackageInfo() {
  return fse.readJSON(path.resolve(baseDir, '../../package.json'));
}

handlebars.registerHelper(
  'md',
  (str) => new handlebars.SafeString(marked(str, {async: false})),
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
    .sort() // sort twice to get predictable, case insensitive order
    .sort((a, b) => a.localeCompare(b, 'en', {sensitivity: 'base'}))
    .reduce((idx, tag) => {
      idx[tag] = obj[tag];
      return idx;
    }, {});
}

/**
 * Create an index of tags belonging to examples
 * @param {Array<{tags: Array<string>}>} exampleData Array of example data objects.
 * @return {Object<string,Array<number>>} Word index.
 */
function createTagIndex(exampleData) {
  /** @type {Object<string,Array<number>>} */
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
 * @param {Array<{shortdesc: string, title: string, tags: Array<string>}>} exampleData Array of example data objects.
 * @return {Object<string, Object<number, number>>} Word index.
 */
function createWordIndex(exampleData) {
  /** @type {Object<string, Object<number, number>>} */
  const index = {};
  /** @type {Array<'shortdesc'|'title'|'tags'>} */
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
 * @param {PackageJson} pkg Package info.
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
      } else if (dep in pkg.dependencies) {
        dependencies[dep] = pkg.dependencies[dep];
      }
    }
  }
  return dependencies;
}

export default class ExampleBuilder {
  /**
   * A webpack plugin that builds the html files for our examples.
   * @param {Options} config Plugin configuration.
   */
  constructor(config) {
    this.name = 'ExampleBuilder';
    this.templates = config.templates;
    this.common = config.common;
    this.linter = new eslint.Linter({configType: 'flat'});
    /** @type {Object<string,{original: string, cleaned: string}>} */
    this.lintCache = {};
  }

  /**
   * Called by webpack.
   * @param {import('webpack').Compiler} compiler The webpack compiler.
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation) => {
      compilation.hooks.additionalAssets.tapPromise(this.name, async () => {
        await this.addAssets(compilation.assets, compiler.context);
      });
    });
  }

  /**
   * @param {import('webpack').CompilationAssets} assets Assets
   * @param {string} dir Examples dir
   */
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
      names.map((name) => this.parseExample(dir, name)),
    );

    const examples = exampleData.map((data) => ({
      link: data.filename,
      title: data.title,
      shortdesc: data.shortdesc,
      tags: data.tags,
    }));

    examples.sort((a, b) =>
      a.title.localeCompare(b.title, 'en', {sensitivity: 'base'}),
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

    const pkg = await getPackageInfo();
    await Promise.all(
      exampleData.map(async (data) => {
        const newAssets = await this.render(data, pkg);
        for (const file in newAssets) {
          assets[file] = new RawSource(newAssets[file]);
        }
      }),
    );

    const indexSource = `const info = ${JSON.stringify(info)};`;
    assets['examples-info.js'] = new RawSource(indexSource);
  }

  /**
   * @param {string} dir Examles dir
   * @param {string} name Example name
   * @return {TemplateConfig} Config from the examles's html template file
   */
  async parseExample(dir, name) {
    const htmlName = `${name}.html`;
    const htmlPath = path.join(dir, htmlName);
    const htmlSource = await fse.readFile(htmlPath, {encoding: 'utf8'});
    const {attributes: data, body} = frontMatter(
      this.ensureNewLineAtEnd(htmlSource),
    );
    assert(!!data.layout, `missing layout in ${htmlPath}`);
    return Object.assign(data, {
      contents: body,
      filename: htmlName,
      dir: dir,
      name: name,
      // process tags
      tags: data.tags ? data.tags.replace(/[\s"]+/g, '').split(',') : [],
    });
  }

  /**
   * @param {string} source A string
   * @return {string} Same string without a newline character at end
   */
  ensureNewLineAtEnd(source) {
    if (source[source.length - 1] !== '\n') {
      source += '\n';
    }
    return source;
  }

  /**
   * @param {string} source Source code
   * @return {string} Transformed source
   */
  transformJsSource(source) {
    return (
      source
        // remove "../src/" prefix to have the same import syntax as the documentation
        .replaceAll(
          /(["'])(\.\.\/src\/ol\/[^"']+\.js)\1/g,
          (full, quote, path) => "'" + path.slice(7) + "'",
        )
        // Remove worker loader import and modify `new Worker()` to add source
        .replaceAll(/import Worker from 'worker-loader![^\n]*\n/g, '')
        .replace('new Worker()', "new Worker('./worker.js', {type: 'module'})")
    );
  }

  /**
   * @param {string} source Source file
   * @param {Array<{key: string, value: string}>|undefined} cloak Replacement rules
   * @return {string} The source with all keys replaced by value
   */
  cloakSource(source, cloak) {
    if (cloak) {
      for (const entry of cloak) {
        source = source.replaceAll(entry.key, entry.value);
      }
    }
    return source;
  }

  /**
   * Remove `/** @type {...} *` comments
   * @param {string} cacheKey Cache key
   * @param {string} sourceCode Source code
   * @return {string} Cleaned up source code
   */
  removeTypeComments(cacheKey, sourceCode) {
    let cacheItem = this.lintCache[cacheKey];
    if (!cacheItem || cacheItem.original !== sourceCode) {
      const ast = parse(sourceCode, {
        comment: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
      });
      let cleanedSource = '';
      let start = 0;
      for (let i = 0, ii = ast.comments.length; i < ii; ++i) {
        const comment = ast.comments[i];
        if (!comment.value.startsWith('* @type ')) {
          continue;
        }
        cleanedSource += sourceCode.slice(start, comment.start);
        start = comment.end;
      }
      cleanedSource += sourceCode.slice(start);
      cleanedSource = this.linter.verifyAndFix(
        cleanedSource,
        flatConfig,
      ).output;
      cacheItem = {original: sourceCode, cleaned: cleanedSource};
      this.lintCache[cacheKey] = cacheItem;
    }
    return cacheItem.cleaned;
  }

  /**
   * @param {TemplateConfig} data Config for this example
   * @param {PackageJson} pkg Data from package.json
   * @return {Object<string, string>} Asset for this example
   */
  async render(data, pkg) {
    /** @type {Object<string, string>} */
    const assets = {};
    const readOptions = {encoding: 'utf8'};

    // add in script tag
    const jsName = `${data.name}.js`;
    const jsPath = path.join(data.dir, jsName);
    let jsSource = await fse.readFile(jsPath, {encoding: 'utf8'});
    jsSource = this.removeTypeComments(
      jsPath,
      this.transformJsSource(this.cloakSource(jsSource, data.cloak)),
    );
    data.js = {
      local: [],
      remote: [],
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
          source = this.cloakSource(source, data.cloak);
          if (ext === 'js') {
            source = this.removeTypeComments(
              fileName,
              this.transformJsSource(source),
            );
            jsSources += '\n' + source;
          }
          assets[fileName] = source;
          return {
            name: sourceConfig.as || fileName,
            source: source,
            type: ext,
          };
        }),
      );
    }

    data.olVersion = pkg.version;
    data.pkgJson = JSON.stringify(
      {
        name: data.name,
        dependencies: getDependencies(jsSources, pkg),
        devDependencies: {
          vite: '^3.2.3',
        },
        scripts: {
          start: 'vite',
          build: 'vite build',
        },
      },
      null,
      2,
    );

    data.css = {
      local: [],
      remote: [],
      source: undefined,
    };

    // add additional resources
    if (data.resources) {
      data.resources.forEach((resource) => {
        const absoluteUrl = /^https?:\/\//.test(resource)
          ? resource
          : `https://openlayers.org/en/v${pkg.version}/examples/${resource}`;
        if (isJsRegEx.test(resource)) {
          if (!isTemplateJs.test(resource)) {
            data.js.local.push(resource);
          }
          data.js.remote.push(absoluteUrl);
        } else if (isCssRegEx.test(resource)) {
          if (!isTemplateCss.test(resource)) {
            data.css.local.push(resource);
          }
          data.css.remote.push(absoluteUrl);
        } else {
          throw new Error(
            `Invalid resource: '${resource}' is not .js or .css: ${data.filename}`,
          );
        }
      });
    }

    data.js.local.push(`${this.common}.js`, jsName);

    // check for example css
    const cssName = `${data.name}.css`;
    const cssPath = path.join(data.dir, cssName);
    try {
      assets[cssName] = await fse.readFile(cssPath, readOptions);
      data.css.local.push(cssName);
      data.css.source = this.ensureNewLineAtEnd(assets[cssName]);
    } catch {
      // pass, no css for this example
    }

    const templatePath = path.join(this.templates, data.layout);
    const templateSource = await fse.readFile(templatePath, readOptions);

    assets[data.filename] = handlebars.compile(templateSource)(data);
    return assets;
  }
}
