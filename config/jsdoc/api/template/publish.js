/*global env: true */
var template = require('jsdoc/lib/jsdoc/template'),
    fs = require('jsdoc/lib/jsdoc/fs'),
    path = require('jsdoc/lib/jsdoc/path'),
    taffy = require('taffydb').taffy,
    handle = require('jsdoc/lib/jsdoc/util/error').handle,
    helper = require('jsdoc/lib/jsdoc/util/templateHelper'),
    _ = require('underscore'),
    htmlsafe = helper.htmlsafe,
    linkto = helper.linkto,
    resolveAuthorLinks = helper.resolveAuthorLinks,
    scopeToPunc = helper.scopeToPunc,
    hasOwnProp = Object.prototype.hasOwnProperty,
    data,
    view,
    outdir = env.opts.destination;

function find(spec) {
    return helper.find(data, spec);
}

function tutoriallink(tutorial) {
    return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
}

function getAncestorLinks(doclet) {
    return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
    if ( !/^(#.+)/.test(hash) ) { return hash; }

    var url = helper.createLink(doclet);

    url = url.replace(/(#.+|$)/, hash);
    return '<a href="' + url + '">' + hash + '</a>';
}

function needsSignature(doclet) {
    var needsSig = false;

    // function and class definitions always get a signature
    if (doclet.kind === 'function' || doclet.kind === 'class') {
        needsSig = true;
    }
    // typedefs that contain functions get a signature, too
    else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
        doclet.type.names.length) {
        for (var i = 0, l = doclet.type.names.length; i < l; i++) {
            if (doclet.type.names[i].toLowerCase() === 'function') {
                needsSig = true;
                break;
            }
        }
    }

    return needsSig;
}

function addSignatureParams(f) {
    var params = helper.getSignatureParams(f, 'optional');

    f.signature = (f.signature || '') + '('+params.join(', ')+')';
}

function addSignatureReturns(f) {
    var returnTypes = helper.getSignatureReturns(f);

    f.signature = '<span class="signature">'+(f.signature || '') + '</span>';

    if (returnTypes.length) {
        f.signature += '<span class="glyphicon glyphicon-circle-arrow-right"></span><span class="type-signature returnType">'+(returnTypes.length ? '{'+returnTypes.join('|')+'}' : '')+'</span>';
    }
}

function addSignatureTypes(f) {
    var types = helper.getSignatureTypes(f);

    f.signature = (f.signature || '') + '<span class="type-signature">'+(types.length? ' :'+types.join('|') : '')+' </span>';
}

function shortenPaths(files, commonPrefix) {
    // always use forward slashes
    var regexp = new RegExp('\\\\', 'g');

    Object.keys(files).forEach(function(file) {
        files[file].shortened = files[file].resolved.replace(commonPrefix, '')
            .replace(regexp, '/');
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

    var filepath = doclet.meta.path && doclet.meta.path !== 'null' ?
        doclet.meta.path + '/' + doclet.meta.filename.split(/[\/\\]/).pop() :
        doclet.meta.filename;

    return filepath;
}

function generate(title, docs, filename, resolveLinks) {
    resolveLinks = resolveLinks === false ? false : true;

    var docData = {
        filename: filename,
        title: title,
        docs: docs,
        packageInfo: ( find({kind: 'package'}) || [] ) [0]
    };

    var outpath = path.join(outdir, filename),
        html = view.render('container.tmpl', docData);

    if (resolveLinks) {
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
    }

    fs.writeFileSync(outpath, html, 'utf8');
}

function generateSourceFiles(sourceFiles) {
    Object.keys(sourceFiles).forEach(function(file) {
        var source;
        // links are keyed to the shortened path in each doclet's `meta.filename` property
        var sourceOutfile = helper.getUniqueFilename(sourceFiles[file].shortened);
        helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

        try {
            source = {
                kind: 'source',
                code: helper.htmlsafe( fs.readFileSync(sourceFiles[file].resolved, 'utf8') )
            };
        }
        catch(e) {
            handle(e);
        }

        generate('Source: ' + sourceFiles[file].shortened, [source], sourceOutfile,
            false);
    });
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
    var symbols = {};

    // build a lookup table
    doclets.forEach(function(symbol) {
        symbols[symbol.longname] = symbol;
    });

    return modules.map(function(module) {
        if (symbols[module.longname]) {
            module.module = symbols[module.longname];
            module.module.name = module.module.name.replace('module:', 'require("') + '")';
        }
    });
}

/**
 * Create the navigation sidebar.
 * @param {object} members The members that will be used to create the sidebar.
 * @param {array<object>} members.classes
 * @param {array<object>} members.externals
 * @param {array<object>} members.globals
 * @param {array<object>} members.mixins
 * @param {array<object>} members.modules
 * @param {array<object>} members.namespaces
 * @param {array<object>} members.tutorials
 * @param {array<object>} members.events
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav(members) {
    var nav = [];
    // merge namespaces and classes, then sort
    var merged = members.namespaces.concat(members.classes);
    merged.sort(function (a, b) {
      if (a.longname > b.longname)
        return 1;
      if (a.longname < b.longname)
        return -1;
      return 0;
    });
    _.each(merged, function (v) {
      // exclude 'olx' and interfaces from sidebar
      if (v.longname.indexOf('olx') !== 0 && v.interface !== true) {
          if (v.kind == 'namespace') {
            nav.push({
                type: 'namespace',
                longname: v.longname,
                name: v.name,
                members: find({
                    kind: 'member',
                    memberof: v.longname
                }),
                methods: find({
                    kind: 'function',
                    memberof: v.longname
                }),
                typedefs: find({
                    kind: 'typedef',
                    memberof: v.longname
                }),
                events: find({
                    kind: 'event',
                    memberof: v.longname
                })
            });
          }
          if (v.kind == 'class') {
            nav.push({
                type: 'class',
                longname: v.longname,
                name: v.name,
                members: find({
                    kind: 'member',
                    memberof: v.longname
                }),
                methods: find({
                    kind: 'function',
                    memberof: v.longname
                }),
                typedefs: find({
                    kind: 'typedef',
                    memberof: v.longname
                }),
                fires: v.fires,
                events: find({
                    kind: 'event',
                    memberof: v.longname
                })
            });
          }
      }
    });
    return nav;
}


/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
    data = taffyData;

    var conf = env.conf.templates || {};
    conf['default'] = conf['default'] || {};

    var templatePath = opts.template;
    view = new template.Template(templatePath + '/tmpl');

    // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
    // doesn't try to hand them out later
    var indexUrl = helper.getUniqueFilename('index');
    // don't call registerLink() on this one! 'index' is also a valid longname

    var globalUrl = helper.getUniqueFilename('global');
    helper.registerLink('global', globalUrl);

    // set up templating
    view.layout = 'layout.tmpl';

    // set up tutorials for helper
    helper.setTutorials(tutorials);

    data = helper.prune(data);
    data.sort('longname, version, since');
    helper.addEventListeners(data);

    var sourceFiles = {};
    var sourceFilePaths = [];
    data().each(function(doclet) {
         doclet.attribs = '';

        if (doclet.examples) {
            doclet.examples = doclet.examples.map(function(example) {
                var caption, code;

                if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code    = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || example
                };
            });
        }
        if (doclet.see) {
            doclet.see.forEach(function(seeItem, i) {
                doclet.see[i] = hashToLink(doclet, seeItem);
            });
        }

        // build a list of source files
        var sourcePath;
        var resolvedSourcePath;
        if (doclet.meta) {
            sourcePath = getPathFromDoclet(doclet);
            resolvedSourcePath = resolveSourcePath(sourcePath);
            sourceFiles[sourcePath] = {
                resolved: resolvedSourcePath,
                shortened: null
            };
            sourceFilePaths.push(resolvedSourcePath);
        }
    });

    fs.mkPath(outdir);

    // copy the template's static files to outdir
    var fromDir = path.join(templatePath, 'static');
    var staticFiles = fs.ls(fromDir, 3);

    staticFiles.forEach(function(fileName) {
        var toDir = fs.toDir( fileName.replace(fromDir, outdir) );
        fs.mkPath(toDir);
        fs.copyFileSync(fileName, toDir);
    });

    // copy user-specified static files to outdir
    var staticFilePaths;
    var staticFileFilter;
    var staticFileScanner;
    if (conf['default'].staticFiles) {
        staticFilePaths = conf['default'].staticFiles.paths || [];
        staticFileFilter = new (require('jsdoc/lib/jsdoc/src/filter')).Filter(conf['default'].staticFiles);
        staticFileScanner = new (require('jsdoc/lib/jsdoc/src/scanner')).Scanner();

        staticFilePaths.forEach(function(filePath) {
            var extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

            extraStaticFiles.forEach(function(fileName) {
                var sourcePath = fs.statSync(filePath).isDirectory() ? filePath :
                    path.dirname(filePath);
                var toDir = fs.toDir( fileName.replace(sourcePath, outdir) );
                fs.mkPath(toDir);
                fs.copyFileSync(fileName, toDir);
            });
        });
    }

    if (sourceFilePaths.length) {
        sourceFiles = shortenPaths( sourceFiles, path.commonPrefix(sourceFilePaths) );
    }
    data().each(function(doclet) {
        var url = helper.createLink(doclet);
        helper.registerLink(doclet.longname, url);

        // replace the filename with a shortened version of the full path
        var docletPath;
        if (doclet.meta) {
            docletPath = getPathFromDoclet(doclet);
            docletPath = sourceFiles[docletPath].shortened;
            if (docletPath) {
                doclet.meta.filename = docletPath;
            }
        }
    });

    data().each(function(doclet) {
        var url = helper.longnameToUrl[doclet.longname];

        if (url.indexOf('#') > -1) {
            doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
        }
        else {
            doclet.id = doclet.name;
        }

        if ( needsSignature(doclet) ) {
            addSignatureParams(doclet);
            addSignatureReturns(doclet);
        }
    });

    // do this after the urls have all been generated
    data().each(function(doclet) {
        doclet.ancestors = getAncestorLinks(doclet);

        if (doclet.kind === 'member') {
            addSignatureTypes(doclet);
        }

        if (doclet.kind === 'constant') {
            addSignatureTypes(doclet);
            doclet.kind = 'member';
        }
    });

    var members = helper.getMembers(data);
    members.tutorials = tutorials.children;

    // add template helpers
    view.find = find;
    view.linkto = linkto;
    view.resolveAuthorLinks = resolveAuthorLinks;
    view.tutoriallink = tutoriallink;
    view.htmlsafe = htmlsafe;
    view.members = members; //@davidshimjs: To make navigation for customizing

    // once for all
    view.nav = buildNav(members);
    attachModuleSymbols( find({ kind: ['class', 'function'], longname: {left: 'module:'} }),
        members.modules );

    // only output pretty-printed source files if requested; do this before generating any other
    // pages, so the other pages can link to the source files
    if (conf['default'].outputSourceFiles) {
        generateSourceFiles(sourceFiles);
    }

    if (members.globals.length) { generate('Global', [{kind: 'globalobj'}], globalUrl); }

    // index page displays information from package.json and lists files
    var files = find({kind: 'file'});

    generate('Index',
        [{kind: 'mainpage', readme: opts.readme, longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Main Page'}].concat(files),
    indexUrl);

    // set up the lists that we'll use to generate pages
    var classes = taffy(members.classes);
    var modules = taffy(members.modules);
    var namespaces = taffy(members.namespaces);
    var mixins = taffy(members.mixins);
    var externals = taffy(members.externals);

    for (var longname in helper.longnameToUrl) {
        if ( hasOwnProp.call(helper.longnameToUrl, longname) ) {
            var myClasses = helper.find(classes, {longname: longname});
            if (myClasses.length) {
                generate('Class: ' + myClasses[0].name, myClasses, helper.longnameToUrl[longname]);
            }

            var myModules = helper.find(modules, {longname: longname});
            if (myModules.length) {
                generate('Module: ' + myModules[0].name, myModules, helper.longnameToUrl[longname]);
            }

            var myNamespaces = helper.find(namespaces, {longname: longname});
            if (myNamespaces.length) {
                generate('Namespace: ' + myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);
            }

            var myMixins = helper.find(mixins, {longname: longname});
            if (myMixins.length) {
                generate('Mixin: ' + myMixins[0].name, myMixins, helper.longnameToUrl[longname]);
            }

            var myExternals = helper.find(externals, {longname: longname});
            if (myExternals.length) {
                generate('External: ' + myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
            }
        }
    }

    // TODO: move the tutorial functions to templateHelper.js
    function generateTutorial(title, tutorial, filename) {
        var tutorialData = {
            title: title,
            header: tutorial.title,
            content: tutorial.parse(),
            children: tutorial.children
        };

        var tutorialPath = path.join(outdir, filename),
            html = view.render('tutorial.tmpl', tutorialData);

        // yes, you can use {@link} in tutorials too!
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

        fs.writeFileSync(tutorialPath, html, 'utf8');
    }

    // tutorials can have only one parent so there is no risk for loops
    function saveChildren(node) {
        node.children.forEach(function(child) {
            generateTutorial('Tutorial: ' + child.title, child, helper.tutorialToUrl(child.name));
            saveChildren(child);
        });
    }
    saveChildren(tutorials);
};
