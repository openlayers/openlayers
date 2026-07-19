import assert from 'assert';
import eslint from 'eslint';
import {parse} from 'espree';
import frontMatter from 'front-matter';
import fs from 'fs';
import fse from 'fs-extra';
import handlebars from 'handlebars';
import {marked} from 'marked';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import flatConfig from '../eslint.config.js';

const baseDir = dirname(fileURLToPath(import.meta.url));
const root = path.join(baseDir, '..');

const isCssRegEx = /\.css(\?.*)?$/;
const isJsRegEx = /\.js(\?.*)?$/;
const importRegEx = /\s?import (?:.*? from )?'([^']+)'/g;
const isTemplateJs = /\/(?:bootstrap(?:\.bundle)?)(?:\.min)?\.js(?:\?.*)?$/;
const isTemplateCss =
  /\/(?:bootstrap|fontawesome-free@[\d.]+\/css\/(?:fontawesome|brands|solid))(?:\.min)?\.css(?:\?.*)?$/;

const exampleNames = fs
  .readdirSync(baseDir)
  .filter((name) => /^(?!index).*\.html$/.test(name))
  .map((name) => name.replace(/\.html$/, ''));

function getPackageInfo() {
  return fse.readJSON(path.resolve(root, 'package.json'));
}

handlebars.registerHelper(
  'md',
  (str) => new handlebars.SafeString(marked(str, {async: false})),
);

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

function sortObjectByKey(obj) {
  return Object.keys(obj)
    .sort()
    .sort((a, b) => a.localeCompare(b, 'en', {sensitivity: 'base'}))
    .reduce((idx, tag) => {
      idx[tag] = obj[tag];
      return idx;
    }, {});
}

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

class ExampleBuilder {
  constructor(config) {
    this.templates = config.templates;
    this.linter = new eslint.Linter({configType: 'flat'});
    this.lintCache = {};
  }

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
      tags: data.tags ? data.tags.replace(/[\s"]+/g, '').split(',') : [],
    });
  }

  ensureNewLineAtEnd(source) {
    if (source[source.length - 1] !== '\n') {
      source += '\n';
    }
    return source;
  }

  transformJsSource(source) {
    return source
      .replaceAll(
        /(["'])(\.\.\/src\/ol\/[^"']+\.js)\1/g,
        (full, quote, importPath) => "'" + importPath.slice(7) + "'",
      )
      .replaceAll(/import Worker from 'worker-loader![^\n]*\n/g, '')
      .replace('new Worker()', "new Worker('./worker.js', {type: 'module'})");
  }

  cloakSource(source, cloak) {
    if (cloak) {
      for (const entry of cloak) {
        source = source.replaceAll(entry.key, entry.value);
      }
    }
    return source;
  }

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

  async render(data, pkg) {
    const assets = {};
    const readOptions = {encoding: 'utf8'};

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
      module: jsName,
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

    const cssName = `${data.name}.css`;
    const cssPath = path.join(data.dir, cssName);
    try {
      assets[cssName] = await fse.readFile(cssPath, readOptions);
      data.css.local.push(cssName);
      data.css.source = this.ensureNewLineAtEnd(assets[cssName]);
    } catch {
      // pass
    }

    const templatePath = path.join(this.templates, data.layout);
    const templateSource = await fse.readFile(templatePath, readOptions);

    assets[data.filename] = handlebars.compile(templateSource)(data);
    return assets;
  }
}

async function buildExamples(builder) {
  const exampleData = await Promise.all(
    exampleNames.map((name) => builder.parseExample(baseDir, name)),
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
  const assets = {
    'examples-info.js': `const info = ${JSON.stringify(info)};`,
  };
  await Promise.all(
    exampleData.map(async (data) => {
      Object.assign(assets, await builder.render(data, pkg));
    }),
  );
  return assets;
}

function sendFile(res, filePath, contentType) {
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  fs.createReadStream(filePath).pipe(res);
}

export default function exampleBuilder(config) {
  const builder = new ExampleBuilder(config);
  let cachedAssets;

  async function getAssets() {
    if (!cachedAssets) {
      cachedAssets = await buildExamples(builder);
    }
    return cachedAssets;
  }

  return {
    name: 'example-builder',
    transform(code, id) {
      if (!id.includes(`${path.sep}examples${path.sep}`) || id.includes('?')) {
        return null;
      }
      const match = code.match(
        /import\s+(\w+)\s+from\s+['"]worker-loader!(.+?)['"]/,
      );
      if (!match) {
        return null;
      }
      const [, binding, workerPath] = match;
      return {
        code: code
          .replace(/import\s+\w+\s+from\s+['"]worker-loader!.+?['"];?\n?/, '')
          .replace(
            new RegExp(`new\\s+${binding}\\(\\)`),
            `new Worker(new URL('${workerPath}', import.meta.url), {type: 'module'})`,
          ),
        map: null,
      };
    },
    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (
          file.startsWith(baseDir) &&
          (file.endsWith('.html') ||
            file.endsWith('.js') ||
            file.endsWith('.css'))
        ) {
          cachedAssets = undefined;
        }
      });

      server.middlewares.use(async (req, res, next) => {
        try {
          const url = req.url?.split('?')[0];
          if (!url) {
            return next();
          }

          if (url === '/examples-info.js') {
            const assets = await getAssets();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/javascript');
            res.end(assets['examples-info.js']);
            return;
          }

          if (url === '/theme/ol.css') {
            sendFile(res, path.join(root, 'src', 'ol', 'ol.css'), 'text/css');
            return;
          }

          if (url.startsWith('/theme/')) {
            const themePath = path.join(
              root,
              'site',
              'src',
              'theme',
              url.slice('/theme/'.length),
            );
            if (fs.existsSync(themePath) && fs.statSync(themePath).isFile()) {
              const ext = path.extname(themePath);
              const types = {
                '.css': 'text/css',
                '.svg': 'image/svg+xml',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.webp': 'image/webp',
              };
              sendFile(
                res,
                themePath,
                types[ext] || 'application/octet-stream',
              );
              return;
            }
          }

          const htmlMatch = url.match(/^\/([\w-]+)\.html$/);
          if (htmlMatch && exampleNames.includes(htmlMatch[1])) {
            const assets = await getAssets();
            const html = assets[`${htmlMatch[1]}.html`];
            if (html) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/html');
              res.end(html);
              return;
            }
          }

          next();
        } catch (err) {
          next(err);
        }
      });
    },
    async generateBundle() {
      const assets = await buildExamples(builder);
      for (const [fileName, source] of Object.entries(assets)) {
        this.emitFile({
          type: 'asset',
          fileName,
          source,
        });
      }
    },
  };
}
