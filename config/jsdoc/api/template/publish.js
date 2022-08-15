/* eslint-disable import/no-commonjs */

/*global env: true */

const hasOwnProp = Object.prototype.hasOwnProperty;

// Work around an issue with hasOwnProperty in JSDoc's templateHelper.js.
//TODO Fix in JSDoc.
Object.prototype.hasOwnProperty = function (property) {
  return property in this;
};

const template = require('jsdoc/lib/jsdoc/template');
const fs = require('jsdoc/lib/jsdoc/fs');
const path = require('jsdoc/lib/jsdoc/path');
const taffy = require('taffydb').taffy;
const handle = require('jsdoc/lib/jsdoc/util/error').handle;
const helper = require('jsdoc/lib/jsdoc/util/templateHelper');
const htmlsafe = helper.htmlsafe;
const resolveAuthorLinks = helper.resolveAuthorLinks;
const outdir = env.opts.destination;

// Work around an issue with hasOwnProperty in JSDoc's templateHelper.js.
//TODO Fix in JSDoc.
Object.prototype.hasOwnProperty = hasOwnProp;

let view;
let data;

function find(spec) {
  return helper.find(data, spec);
}

function getShortName(longname) {
  if (!longname.includes('module:ol/')) {
    return longname;
  }
  if (longname.includes('|')) {
    return longname;
  }
  if (longname.includes('<')) {
    return longname;
  }
  return longname.split(/[\~\.#\:]/).pop();
}

function linkto(longname, linkText, cssClass, fragmentId) {
  if (linkText) {
    return helper.linkto(longname, linkText, cssClass, fragmentId);
  }

  if (!longname.includes('module:ol/')) {
    return helper.linkto(longname, linkText, cssClass, fragmentId);
  }

  // check for `Array<foo|bar>` types (but allow `Array<foo>|Array<bar>` types)
  let openBrackets = 0;
  let parseTypes = false;
  for (const c of longname) {
    if (c === '<') {
      openBrackets += 1;
      continue;
    }
    if (c === '>') {
      openBrackets -= 1;
      continue;
    }
    if (openBrackets > 0 && c === '|') {
      parseTypes = true;
      break;
    }
  }
  if (parseTypes) {
    // collections or generics with unions get parsed by catharsis and
    // will unfortunamely include long module:ol/foo names
    return helper.linkto(longname, '', cssClass, fragmentId);
  }

  // handle union types
  if (longname.includes('|')) {
    return longname
      .split('|')
      .map((part) => linkto(part, '', cssClass, fragmentId))
      .join(' | ');
  }

  const match = longname.match(/(.+?)\.?<(.+)>$/);
  // handle generics and collections
  if (match) {
    return (
      linkto(match[1], '', cssClass, fragmentId) +
      '<' +
      linkto(match[2], '', cssClass, fragmentId) +
      '>'
    );
  }

  return helper.linkto(
    longname,
    htmlsafe(getShortName(longname)),
    cssClass,
    fragmentId
  );
}

function tutoriallink(tutorial) {
  return helper.toTutorial(tutorial, null, {
    tag: 'em',
    classname: 'disabled',
    prefix: 'Tutorial: ',
  });
}

function getAncestorLinks(doclet) {
  return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
  if (!/^(#.+)/.test(hash)) {
    return hash;
  }

  let url = helper.createLink(doclet);

  url = url.replace(/(#.+|$)/, hash);
  return '<a href="' + url + '">' + hash + '</a>';
}

function needsSignature(doclet) {
  let needsSig = false;

  // function and class definitions always get a signature
  if (doclet.kind === 'function' || doclet.kind === 'class') {
    needsSig = true;
  } else if (
    doclet.kind === 'typedef' &&
    doclet.type &&
    doclet.type.names &&
    doclet.type.names.length
  ) {
    // typedefs that contain functions get a signature, too
    for (let i = 0, l = doclet.type.names.length; i < l; i++) {
      if (doclet.type.names[i].toLowerCase() === 'function') {
        needsSig = true;
        break;
      }
    }
  }

  return needsSig;
}

function addSignatureParams(f) {
  const params = helper.getSignatureParams(f, 'optional');

  f.signature = (f.signature || '') + '(' + params.join(', ') + ')';
}

/**
 * Copied from https://github.com/jsdoc/jsdoc/blob/main/packages/jsdoc/lib/jsdoc/util/templateHelper.js
 * Modified to call our own `linkto` to shorten names.
 * @param {Object} doclet The doclet.
 * @param {Array} [doclet.yields] The returns.
 * @param {Array} [doclet.returns] The returns.
 * @param {string} cssClass The css class.
 * @return {Array} The returns.
 */
function getSignatureReturns({yields, returns}, cssClass) {
  let returnTypes = [];

  if (yields || returns) {
    (yields || returns).forEach((r) => {
      if (r && r.type && r.type.names) {
        if (!returnTypes.length) {
          returnTypes = r.type.names;
        }
      }
    });
  }

  if (returnTypes && returnTypes.length) {
    returnTypes = returnTypes.map((r) => linkto(r, '', cssClass));
  }

  return returnTypes;
}

function addSignatureReturns(f) {
  const returnTypes = getSignatureReturns(f);

  f.signature = '<span class="signature">' + (f.signature || '') + '</span>';

  if (returnTypes.length) {
    f.signature +=
      '<span class="fa fa-arrow-circle-right"></span><span class="type-signature returnType">' +
      (returnTypes.length ? '{' + returnTypes.join(' | ') + '}' : '') +
      '</span>';
  }
}

function addSignatureTypes(f) {
  const types = helper.getSignatureTypes(f);

  f.signature =
    (f.signature || '') +
    '<span class="type-signature">' +
    (types.length ? ' :' + types.join('|') : '') +
    ' </span>';
}

function shortenPaths(files, commonPrefix) {
  // always use forward slashes
  Object.keys(files).forEach(function (file) {
    files[file].shortened = files[file].resolved
      .replace(commonPrefix, '')
      .replaceAll('\\', '/');
  });

  return files;
}

function resolveSourcePath(filepath) {
  return path.resolve(process.cwd(), filepath);
}

function getPathFromDoclet(doclet) {
  if (!doclet.meta) {
    return;
  }

  const filepath =
    doclet.meta.path && doclet.meta.path !== 'null'
      ? doclet.meta.path + '/' + doclet.meta.filename.split(/[\/\\]/).pop()
      : doclet.meta.filename;

  return filepath;
}

function preprocessLinks(text) {
  return text.replaceAll(
    /\{@link (module:ol\/\S+?)\}/g,
    (match, longname) => `{@link ${longname} ${getShortName(longname)}}`
  );
}

function generate(title, docs, filename, resolveLinks) {
  resolveLinks = resolveLinks === false ? false : true;

  const docData = {
    filename: filename,
    title: title,
    docs: docs,
    packageInfo: (find({kind: 'package'}) || [])[0],
  };

  const outpath = path.join(outdir, filename);
  let html = view.render('container.tmpl', docData);

  if (resolveLinks) {
    html = helper.resolveLinks(preprocessLinks(html)); // turn {@link foo} into <a href="foodoc.html">foo</a>
  }

  fs.writeFileSync(outpath, html, 'utf8');
}

function generateSourceFiles(sourceFiles) {
  Object.keys(sourceFiles).forEach(function (file) {
    let source;
    // links are keyed to the shortened path in each doclet's `meta.filename` property
    const sourceOutfile = helper.getUniqueFilename(sourceFiles[file].shortened);
    helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

    try {
      source = {
        kind: 'source',
        code: helper.htmlsafe(
          fs.readFileSync(sourceFiles[file].resolved, 'utf8')
        ),
      };
    } catch (e) {
      handle(e);
    }

    generate(
      'Source: ' + sourceFiles[file].shortened,
      [source],
      sourceOutfile,
      false
    );
  });
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array<module:jsdoc/doclet.Doclet>} doclets The array of classes and functions to
 * check.
 * @param {Array<module:jsdoc/doclet.Doclet>} modules The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
  const symbols = {};

  // build a lookup table
  doclets.forEach(function (symbol) {
    symbols[symbol.longname] = symbol;
  });

  modules.forEach(function (module) {
    if (symbols[module.longname]) {
      module.module = symbols[module.longname];
      module.module.name =
        module.module.name.replace('module:', 'require("') + '")';
    }
  });
}

function getPrettyName(doclet) {
  const fullname = doclet.longname.replace('module:', '');
  if (doclet.isDefaultExport) {
    return fullname.split('~')[0];
  }
  return fullname;
}

/**
 * Create the navigation sidebar.
 * @param {Object} members The members that will be used to create the sidebar.
 * @param {Array<Object>} members.classes Classes.
 * @param {Array<Object>} members.externals Externals.
 * @param {Array<Object>} members.globals Globals.
 * @param {Array<Object>} members.mixins Mixins.
 * @param {Array<Object>} members.modules Modules.
 * @param {Array<Object>} members.namespaces Namespaces.
 * @param {Array<Object>} members.tutorials Tutorials.
 * @param {Array<Object>} members.events Events.
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav(members) {
  const nav = [];
  members.classes.forEach(function (v) {
    // exclude interfaces from sidebar
    if (v.interface !== true) {
      nav.push({
        type: 'class',
        longname: v.longname,
        prettyname: getPrettyName(v),
        name: v.name,
        module: find({
          kind: 'module',
          longname: v.memberof,
        })[0],
        members: find({
          kind: 'member',
          memberof: v.longname,
        }),
        methods: find({
          kind: 'function',
          memberof: v.longname,
        }),
        typedefs: find({
          kind: 'typedef',
          memberof: v.longname,
        }),
        fires: v.fires,
        events: find({
          kind: 'event',
          memberof: v.longname,
        }),
      });
    }
  });
  members.modules.forEach(function (v) {
    const classes = find({
      kind: 'class',
      memberof: v.longname,
    });
    const members = find({
      kind: 'member',
      memberof: v.longname,
    });
    const methods = find({
      kind: 'function',
      memberof: v.longname,
    });
    const typedefs = find({
      kind: 'typedef',
      memberof: v.longname,
    });
    const events = find({
      kind: 'event',
      memberof: v.longname,
    });
    // Only add modules that contain more than just classes with their
    // associated Options typedef
    if (
      typedefs.length > classes.length ||
      members.length + methods.length > 0
    ) {
      nav.push({
        type: 'module',
        longname: v.longname,
        prettyname: getPrettyName(v),
        name: v.name,
        members: members,
        methods: methods,
        typedefs: typedefs,
        fires: v.fires,
        events: events,
      });
    }
  });

  nav.sort(function (a, b) {
    const prettyNameA = a.prettyname.toLowerCase();
    const prettyNameB = b.prettyname.toLowerCase();
    if (prettyNameA > prettyNameB) {
      return 1;
    }
    if (prettyNameA < prettyNameB) {
      return -1;
    }
    return 0;
  });
  return nav;
}

/**
 * @param {Object} taffyData See {@link https://taffydb.com/}.
 * @param {Object} opts Options.
 * @param {Object} tutorials Tutorials.
 */
exports.publish = function (taffyData, opts, tutorials) {
  data = taffyData;

  const conf = env.conf.templates || {};
  conf['default'] = conf['default'] || {};

  const templatePath = opts.template;
  view = new template.Template(templatePath + '/tmpl');

  // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
  // doesn't try to hand them out later
  const indexUrl = helper.getUniqueFilename('index');
  // don't call registerLink() on this one! 'index' is also a valid longname

  const globalUrl = helper.getUniqueFilename('global');
  helper.registerLink('global', globalUrl);

  // set up templating
  view.layout = 'layout.tmpl';

  // set up tutorials for helper
  helper.setTutorials(tutorials);

  data = helper.prune(data);
  data.sort('longname, version, since');
  helper.addEventListeners(data);

  let sourceFiles = {};
  const sourceFilePaths = [];
  data().each(function (doclet) {
    doclet.attribs = '';

    if (doclet.examples) {
      doclet.examples = doclet.examples.map(function (example) {
        let caption, code;

        const match = example.match(
          /^\s*<caption>([\s\S]+?)<\/caption>(?:\s*[\n\r])([\s\S]+)$/i
        );
        if (match) {
          caption = match[1];
          code = match[2];
        }

        return {
          caption: caption || '',
          code: code || example,
        };
      });
    }
    if (doclet.see) {
      doclet.see.forEach(function (seeItem, i) {
        doclet.see[i] = hashToLink(doclet, seeItem);
      });
    }

    // build a list of source files
    let sourcePath;
    let resolvedSourcePath;
    if (doclet.meta) {
      sourcePath = getPathFromDoclet(doclet);
      resolvedSourcePath = resolveSourcePath(sourcePath);
      sourceFiles[sourcePath] = {
        resolved: resolvedSourcePath,
        shortened: null,
      };
      sourceFilePaths.push(resolvedSourcePath);
    }
  });

  fs.mkPath(outdir);

  // copy the template's static files to outdir
  const fromDir = path.join(templatePath, 'static');
  const staticFiles = fs.ls(fromDir, 3);

  staticFiles.forEach(function (fileName) {
    const toDir = fs.toDir(fileName.replace(fromDir, outdir));
    fs.mkPath(toDir);
    fs.copyFileSync(fileName, toDir);
  });

  // copy user-specified static files to outdir
  let staticFilePaths;
  let staticFileFilter;
  let staticFileScanner;
  if (conf['default'].staticFiles) {
    staticFilePaths = conf['default'].staticFiles.paths || [];
    staticFileFilter = new (require('jsdoc/lib/jsdoc/src/filter').Filter)(
      conf['default'].staticFiles
    );
    staticFileScanner = new (require('jsdoc/lib/jsdoc/src/scanner').Scanner)();

    staticFilePaths.forEach(function (filePath) {
      const extraStaticFiles = staticFileScanner.scan(
        [filePath],
        10,
        staticFileFilter
      );

      extraStaticFiles.forEach(function (fileName) {
        const sourcePath = fs.statSync(filePath).isDirectory()
          ? filePath
          : path.dirname(filePath);
        const toDir = fs.toDir(fileName.replace(sourcePath, outdir));
        fs.mkPath(toDir);
        fs.copyFileSync(fileName, toDir);
      });
    });
  }

  if (sourceFilePaths.length) {
    sourceFiles = shortenPaths(sourceFiles, path.commonPrefix(sourceFilePaths));
  }
  data().each(function (doclet) {
    const url = helper.createLink(doclet);
    helper.registerLink(doclet.longname, url);

    // replace the filename with a shortened version of the full path
    let docletPath;
    if (doclet.meta) {
      docletPath = getPathFromDoclet(doclet);
      docletPath = sourceFiles[docletPath].shortened;
      if (docletPath) {
        doclet.meta.filename = docletPath;
      }
    }
  });

  data().each(function (doclet) {
    const url = helper.longnameToUrl[doclet.longname];

    if (url.includes('#')) {
      doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
    } else {
      doclet.id = doclet.name;
    }

    if (needsSignature(doclet)) {
      addSignatureParams(doclet);
      addSignatureReturns(doclet);
    }
  });

  // do this after the urls have all been generated
  data().each(function (doclet) {
    doclet.ancestors = getAncestorLinks(doclet);

    if (doclet.kind === 'member') {
      addSignatureTypes(doclet);
    }

    if (doclet.kind === 'constant') {
      addSignatureTypes(doclet);
      doclet.kind = 'member';
    }
  });

  const members = helper.getMembers(data);
  members.tutorials = tutorials.children;

  // add template helpers
  view.find = find;
  view.linkto = linkto;
  view.getShortName = getShortName;
  view.resolveAuthorLinks = resolveAuthorLinks;
  view.tutoriallink = tutoriallink;
  view.htmlsafe = htmlsafe;
  view.members = members; //@davidshimjs: To make navigation for customizing

  // once for all
  view.nav = buildNav(members);

  attachModuleSymbols(
    find({kind: ['class', 'function'], longname: {left: 'module:'}}),
    members.modules
  );

  // only output pretty-printed source files if requested; do this before generating any other
  // pages, so the other pages can link to the source files
  if (conf['default'].outputSourceFiles) {
    generateSourceFiles(sourceFiles);
  }

  if (members.globals.length) {
    generate('Global', [{kind: 'globalobj'}], globalUrl);
  }

  // index page displays information from package.json and lists files
  const files = find({kind: 'file'});

  view.navigationItems = view.nav.reduce(function (dict, item) {
    dict[item.longname] = item;
    return dict;
  }, {});
  const navigationHtml = helper.resolveLinks(
    view.nav.map((item) => view.partial('navigation.tmpl', {item})).join('')
  );
  const navHtmlPath = path.join(outdir, 'navigation.tmpl.html');
  fs.writeFileSync(navHtmlPath, navigationHtml, 'utf8');

  generate(
    'Index',
    [
      {
        kind: 'mainpage',
        readme: opts.readme,
        longname: opts.mainpagetitle ? opts.mainpagetitle : 'Main Page',
      },
    ].concat(files),
    indexUrl
  );

  // set up the lists that we'll use to generate pages
  const classes = taffy(members.classes);
  const modules = taffy(members.modules);
  const namespaces = taffy(members.namespaces);
  const mixins = taffy(members.mixins);
  const externals = taffy(members.externals);

  for (const longname in helper.longnameToUrl) {
    if (hasOwnProp.call(helper.longnameToUrl, longname)) {
      const myClasses = helper.find(classes, {longname: longname});
      if (myClasses.length) {
        generate(
          'Class: ' + myClasses[0].name,
          myClasses,
          helper.longnameToUrl[longname]
        );
      }

      const myModules = helper.find(modules, {longname: longname});
      if (myModules.length) {
        generate(
          'Module: ' + myModules[0].name,
          myModules,
          helper.longnameToUrl[longname]
        );
      }

      const myNamespaces = helper.find(namespaces, {longname: longname});
      if (myNamespaces.length) {
        generate(
          'Namespace: ' + myNamespaces[0].name,
          myNamespaces,
          helper.longnameToUrl[longname]
        );
      }

      const myMixins = helper.find(mixins, {longname: longname});
      if (myMixins.length) {
        generate(
          'Mixin: ' + myMixins[0].name,
          myMixins,
          helper.longnameToUrl[longname]
        );
      }

      const myExternals = helper.find(externals, {longname: longname});
      if (myExternals.length) {
        generate(
          'External: ' + myExternals[0].name,
          myExternals,
          helper.longnameToUrl[longname]
        );
      }
    }
  }

  // TODO: move the tutorial functions to templateHelper.js
  function generateTutorial(title, tutorial, filename) {
    const tutorialData = {
      title: title,
      header: tutorial.title,
      content: tutorial.parse(),
      children: tutorial.children,
    };

    let html = view.render('tutorial.tmpl', tutorialData);
    // yes, you can use {@link} in tutorials too!
    html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

    const tutorialPath = path.join(outdir, filename);
    fs.writeFileSync(tutorialPath, html, 'utf8');
  }

  // tutorials can have only one parent so there is no risk for loops
  function saveChildren(node) {
    node.children.forEach(function (child) {
      generateTutorial(
        'Tutorial: ' + child.title,
        child,
        helper.tutorialToUrl(child.name)
      );
      saveChildren(child);
    });
  }
  saveChildren(tutorials);
};
