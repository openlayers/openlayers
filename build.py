#!/usr/bin/env python

from cStringIO import StringIO
import gzip
import json
import os
import glob
import re
import shutil
import sys

from pake import Target
from pake import ifind, main, output, rule, target, variables, virtual, which


if sys.platform == 'win32':

    win = {
        'CLEANCSS': './node_modules/.bin/cleancss',
        'GIT': 'git.exe',
        'GJSLINT': 'gjslint.exe',
        'JSDOC': './node_modules/.bin/jsdoc',
        'JSHINT': './node_modules/.bin/jshint',
        'PYTHON': 'python.exe',
        'PHANTOMJS': './node_modules/.bin/phantomjs'
    }

    sys_dir = os.environ.get('SYSTEMDRIVE')
    program_files = os.environ.get('PROGRAMFILES')

    if not which(win['GIT']):
        win['GIT'] = os.path.join(program_files, 'Git', 'cmd', 'git.exe')
    if not which(win['GIT']):
        win['GIT'] = os.path.join(program_files, 'Git', 'bin', 'git.exe')

    if not which(win['PYTHON']):
        win['PYTHON'] = os.path.join(sys_dir, 'Python27', 'python.exe')

    if not which(win['GJSLINT']):
        win['GJSLINT'] = os.path.join(sys_dir, 'Python27', 'Scripts', 'gjslint.exe')

    if not which(win['PHANTOMJS']):
        win['PHANTOMJS'] = 'phantomjs.exe'
    if not which(win['PHANTOMJS']):
        win['PHANTOMJS'] = os.path.join(sys_dir, 'phantomjs-1.9.7-windows', 'phantomjs.exe')

    if not which(win['JSDOC']):
        win['JSDOC'] = os.path.join(program_files, 'jsdoc3', 'jsdoc.cmd')

    for program, path in win.iteritems():
        setattr(variables, program, path)

else:
    variables.CLEANCSS = './node_modules/.bin/cleancss'
    variables.GIT = 'git'
    variables.GJSLINT = 'gjslint'
    variables.JSHINT = './node_modules/.bin/jshint'
    variables.JSDOC = './node_modules/.bin/jsdoc'
    variables.PYTHON = 'python'
    variables.PHANTOMJS = './node_modules/.bin/phantomjs'

variables.BRANCH = output(
    '%(GIT)s', 'rev-parse', '--abbrev-ref', 'HEAD').strip()

EXECUTABLES = [variables.CLEANCSS, variables.GIT, variables.GJSLINT,
               variables.JSDOC, variables.JSHINT, variables.PYTHON,
               variables.PHANTOMJS]

EXAMPLES = [path
            for path in ifind('examples')
            if path.endswith('.html')
            if path != 'examples/index.html']

EXAMPLES_SRC = [path
                for path in ifind('examples')
                if path.endswith('.js')
                if not path.endswith('.combined.js')
                if not path.startswith('examples/bootstrap')
                if path != 'examples/Jugl.js'
                if path != 'examples/jquery.min.js'
                if path != 'examples/example-list.js']

EXAMPLES_JSON = ['build/' + example.replace('.html', '.json')
                 for example in EXAMPLES]

EXAMPLES_COMBINED = ['build/' + example.replace('.html', '.combined.js')
                     for example in EXAMPLES]

GLSL_SRC = [path
            for path in ifind('src')
            if path.endswith('.glsl')]

JSDOC_SRC = [path
             for path in ifind('src')
             if path.endswith('.jsdoc')]

SHADER_SRC = [path.replace('.glsl', 'shader.js')
              for path in GLSL_SRC]

SPEC = [path
        for path in ifind('test/spec')
        if path.endswith('.js')]

TASKS = [path
         for path in ifind('tasks')
         if path.endswith('.js')]

SRC = [path
       for path in ifind('src/ol')
       if path.endswith('.js')
       if path not in SHADER_SRC]


def report_sizes(t):
    stringio = StringIO()
    gzipfile = gzip.GzipFile(t.name, 'w', 9, stringio)
    with open(t.name, 'rb') as f:
        shutil.copyfileobj(f, gzipfile)
    gzipfile.close()
    rawsize = os.stat(t.name).st_size
    gzipsize = len(stringio.getvalue())
    savings = '{0:.2%}'.format((rawsize - gzipsize)/float(rawsize))
    t.info('uncompressed: %8d bytes', rawsize)
    t.info('  compressed: %8d bytes, (saved %s)', gzipsize, savings)


virtual('default', 'build')


virtual('ci', 'lint', 'build', 'test',
    'build/examples/all.combined.js', 'check-examples', 'apidoc')


virtual('build', 'build/ol.css', 'build/ol.js', 'build/ol-debug.js')


virtual('check', 'lint', 'build/ol.js', 'test')


virtual('todo', 'fixme')


@target('build/ol.css', 'css/ol.css')
def build_ol_css(t):
    t.output('%(CLEANCSS)s', 'css/ol.css')


@target('build/ol.js', SRC, SHADER_SRC, 'config/ol.json')
def build_ol_new_js(t):
    t.run('node', 'tasks/build.js', 'config/ol.json', 'build/ol.js')
    report_sizes(t)


@target('build/ol-debug.js', SRC, SHADER_SRC, 'config/ol-debug.json')
def build_ol_debug_js(t):
    t.run('node', 'tasks/build.js', 'config/ol-debug.json', 'build/ol-debug.js')
    report_sizes(t)


for glsl_src in GLSL_SRC:
    def shader_src_helper(glsl_src):
        @target(glsl_src.replace('.glsl', 'shader.js'), glsl_src,
                'src/ol/webgl/shader.mustache', 'bin/pyglslunit.py')
        def shader_src(t):
            t.run('%(PYTHON)s', 'bin/pyglslunit.py',
                  '--input', glsl_src,
                  '--template', 'src/ol/webgl/shader.mustache',
                  '--output', t.name)
    shader_src_helper(glsl_src)


@target('build/test/requireall.js', SPEC)
def build_test_requireall_js(t):
    requires = set()
    for dependency in t.dependencies:
        for line in open(dependency, 'rU'):
            match = re.match(r'goog\.provide\(\'(.*)\'\);', line)
            if match:
                requires.add(match.group(1))
    with open(t.name, 'wb') as f:
        for require in sorted(requires):
            f.write('goog.require(\'%s\');\n' % (require,))


virtual('build-examples', 'examples', 'build/examples/all.combined.js',
        EXAMPLES_COMBINED)


virtual('examples', 'examples/example-list.xml', EXAMPLES_JSON)


@target('examples/example-list.xml', 'examples/example-list.js')
def examples_examples_list_xml(t):
    t.touch()  # already generated by bin/exampleparser.py


@target('examples/example-list.js', 'bin/exampleparser.py', EXAMPLES)
def examples_examples_list_js(t):
    t.run('%(PYTHON)s', 'bin/exampleparser.py', 'examples', 'examples')


@target('build/examples/all.combined.js', 'build/examples/all.js',
        SRC, SHADER_SRC, 'config/examples-all.json')
def build_examples_all_combined_js(t):
    t.run('node', 'tasks/build.js', 'config/examples-all.json',
          'build/examples/all.combined.js')
    report_sizes(t)


@target('build/examples/all.js', EXAMPLES_SRC)
def build_examples_all_js(t):
    t.output('%(PYTHON)s', 'bin/combine-examples.py', t.dependencies)


@rule(r'\Abuild/examples/(?P<id>.*).json\Z')
def examples_star_json(name, match):
    def action(t):
        # It would make more sense to use olx.js as an input file here. We use
        # it as an externs file instead to prevent "Cannot read property '*' of
        # undefined" error when running examples in "raw" or "whitespace" mode.
        # Note that we use the proper way in config/examples-all.json, which
        # is only used to check the examples code using the compiler.
        content = json.dumps({
          "exports": [],
          "src": ["src/**/*.js", "examples/%(id)s.js" % match.groupdict()],
          "compile": {
            "externs": [
              "externs/bingmaps.js",
              "externs/bootstrap.js",
              "externs/closure-compiler.js",
              "externs/example.js",
              "externs/geojson.js",
              "externs/jquery-1.7.js",
              "externs/oli.js",
              "externs/olx.js",
              "externs/proj4js.js",
              "externs/tilejson.js",
              "externs/topojson.js",
              "externs/vbarray.js"
            ],
            "define": [
              "goog.dom.ASSUME_STANDARDS_MODE=true",
              "goog.json.USE_NATIVE_JSON=true",
              "goog.DEBUG=false"
            ],
            "jscomp_error": [
              "accessControls",
              "ambiguousFunctionDecl",
              "checkDebuggerStatement",
              "checkEventfulObjectDisposal",
              "checkProvides",
              "checkRegExp",
              "checkStructDictInheritance",
              "checkTypes",
              "checkVars",
              "const",
              "constantProperty",
              "deprecated",
              "duplicate",
              "duplicateMessage",
              "es3",
              "es5Strict",
              "externsValidation",
              "fileoverviewTags",
              "globalThis",
              "internetExplorerChecks",
              "invalidCasts",
              "misplacedTypeAnnotation",
              "missingProperties",
              "nonStandardJsDocs",
              "strictModuleDepCheck",
              "suspiciousCode",
              "typeInvalidation",
              "tweakValidation",
              "undefinedNames",
              "undefinedVars",
              "unknownDefines",
              "uselessCode",
              "violatedModuleDep",
              "visibility"
            ],
            "extra_annotation_name": [
              "api", "observable"
            ],
            "compilation_level": "ADVANCED",
            "output_wrapper": "// OpenLayers 3. See http://ol3.js.org/\n(function(){%output%})();",
            "use_types_for_optimization": True,
            "manage_closure_dependencies": True
          }
        })
        with open(t.name, 'wb') as f:
            f.write(content)
    return Target(name, action=action, dependencies=[__file__])


@rule(r'\Abuild/examples/(?P<id>.*).combined.js\Z')
def examples_star_combined_js(name, match):
    def action(t):
        config = 'build/examples/%(id)s.json' % match.groupdict()
        t.run('node', 'tasks/build.js', config, name)
        report_sizes(t)
    dependencies = [SRC, SHADER_SRC,
                    'examples/%(id)s.js' % match.groupdict(),
                    'build/examples/%(id)s.json' % match.groupdict()]
    return Target(name, action=action, dependencies=dependencies)


@target('serve', 'examples')
def serve(t):
    t.run('node', 'tasks/serve.js')


virtual('lint', 'build/lint-timestamp', 'build/check-requires-timestamp',
    'build/check-whitespace-timestamp', 'jshint')


@target('build/lint-timestamp', SRC, EXAMPLES_SRC, SPEC, precious=True)
def build_lint_src_timestamp(t):
    t.run('%(GJSLINT)s',
          '--jslint_error=all',
          '--custom_jsdoc_tags=event,fires,function,classdesc,api,observable',
          '--strict',
          t.newer(t.dependencies))
    t.touch()


virtual('jshint', 'build/jshint-timestamp')

@target('build/jshint-timestamp', SRC, EXAMPLES_SRC, SPEC, TASKS,
        precious=True)
def build_jshint_timestamp(t):
    t.run(variables.JSHINT, '--verbose', t.newer(t.dependencies))
    t.touch()


def _strip_comments(lines):
    # FIXME this is a horribe hack, we should use a proper JavaScript parser
    # here
    in_multiline_comment = False
    lineno = 0
    for line in lines:
        lineno += 1
        if in_multiline_comment:
            index = line.find('*/')
            if index != -1:
                in_multiline_comment = False
                line = line[index + 2:]
        if not in_multiline_comment:
            line = re.sub(r'//[^\n]*', '', line)
            line = re.sub(r'/\*.*?\*/', '', line)
            index = line.find('/*')
            if index != -1:
                yield lineno, line[:index]
                in_multiline_comment = True
            else:
                yield lineno, line


@target('build/check-requires-timestamp', SRC, EXAMPLES_SRC, SHADER_SRC, SPEC)
def build_check_requires_timestamp(t):
    unused_count = 0
    all_provides = set()
    closure_lib_path = output('node', '-e',
        'process.stdout.write(require("closure-util").getLibraryPath())')
    for filename in ifind(closure_lib_path):
        if filename.endswith('.js'):
            if not re.match(r'.*/closure/goog/', filename):
                continue
            # Skip goog.i18n because it contains so many modules that it causes
            # the generated regular expression to exceed Python's limits
            if re.match(r'.*/closure/goog/i18n/', filename):
                continue
            for line in open(filename, 'rU'):
                m = re.match(r'goog.provide\(\'(.*)\'\);', line)
                if m:
                    all_provides.add(m.group(1))
    for filename in sorted(t.dependencies):
        require_linenos = {}
        uses = set()
        lines = open(filename, 'rU').readlines()
        for lineno, line in _strip_comments(lines):
            m = re.match(r'goog.provide\(\'(.*)\'\);', line)
            if m:
                all_provides.add(m.group(1))
                continue
            m = re.match(r'goog.require\(\'(.*)\'\);', line)
            if m:
                require_linenos[m.group(1)] = lineno
                continue
        ignore_linenos = require_linenos.values()
        for lineno, line in enumerate(lines):
            if lineno in ignore_linenos:
                continue
            for require in require_linenos.iterkeys():
                if require in line:
                    uses.add(require)
        for require in sorted(set(require_linenos.keys()) - uses):
            t.info('%s:%d: unused goog.require: %r' % (
                filename, require_linenos[require], require))
            unused_count += 1
    all_provides.discard('ol')
    all_provides.discard('ol.MapProperty')

    class Node(object):

        def __init__(self):
            self.present = False
            self.children = {}

        def _build_re(self, key):
            if key == '*':
                assert len(self.children) == 0
                # We want to match `.doIt` but not `.SomeClass` or `.more.stuff`
                return '(?=\\.[a-z]\\w*\\b(?!\\.))'
            elif len(self.children) == 1:
                child_key, child = next(self.children.iteritems())
                child_re = child._build_re(child_key)
                if child_key != '*':
                    child_re = '\\.' + child_re
                if self.present:
                    return key + '(' + child_re + ')?'
                else:
                    return key + child_re
            elif self.children:
                children_re = '(?:' + '|'.join(
                    ('\\.' if k != '*' else '') + self.children[k]._build_re(k)
                    for k in sorted(self.children.keys())) + ')'
                if self.present:
                    return key + children_re + '?'
                else:
                    return key + children_re
            else:
                assert self.present
                return key

        def build_re(self, key):
            return re.compile('\\b' + self._build_re(key) + '\\b')
    root = Node()
    for provide in all_provides:
        node = root
        for component in provide.split('.'):
            if component not in node.children:
                node.children[component] = Node()
            node = node.children[component]
        if component[0].islower():
            # We've arrived at a namespace provide like `ol.foo`.
            # In this case, we want to match uses like `ol.foo.doIt()` but
            # not match things like `new ol.foo.SomeClass()`.
            # For this purpose, we use the special wildcard key for the child.
            node.children['*'] = Node()
        else:
            node.present = True
    provide_res = [child.build_re(key)
                   for key, child in root.children.iteritems()]
    missing_count = 0
    for filename in sorted(t.dependencies):
        provides = set()
        requires = set()
        uses = set()
        uses_linenos = {}
        for lineno, line in _strip_comments(open(filename, 'rU')):
            m = re.match(r'goog.provide\(\'(.*)\'\);', line)
            if m:
                provides.add(m.group(1))
                continue
            m = re.match(r'goog.require\(\'(.*)\'\);', line)
            if m:
                requires.add(m.group(1))
                continue
            while True:
                for provide_re in provide_res:
                    m = provide_re.search(line)
                    if m:
                        uses.add(m.group())
                        uses_linenos[m.group()] = lineno
                        line = line[:m.start()] + line[m.end():]
                        break
                else:
                    break
        if filename == 'src/ol/renderer/layerrenderer.js':
            uses.discard('ol.renderer.Map')
        m = re.match(
            r'src/ol/renderer/(\w+)/\1(\w*)layerrenderer\.js\Z', filename)
        if m:
            uses.discard('ol.renderer.Map')
            uses.discard('ol.renderer.%s.Map' % (m.group(1),))
        missing_requires = uses - requires - provides
        if missing_requires:
            for missing_require in sorted(missing_requires):
                t.info("%s:%d missing goog.require('%s')" %
                       (filename, uses_linenos[missing_require], missing_require))
                missing_count += 1
    if unused_count or missing_count:
        t.error('%d unused goog.requires, %d missing goog.requires' %
                (unused_count, missing_count))
    t.touch()


@target('build/check-whitespace-timestamp', SRC, EXAMPLES_SRC,
        SPEC, JSDOC_SRC, precious=True)
def build_check_whitespace_timestamp(t):
    CR_RE = re.compile(r'\r')
    LEADING_WHITESPACE_RE = re.compile(r'\s+')
    TRAILING_WHITESPACE_RE = re.compile(r'\s+\n\Z')
    NO_NEWLINE_RE = re.compile(r'[^\n]\Z')
    ALL_WHITESPACE_RE = re.compile(r'\s+\Z')
    errors = 0
    for filename in sorted(t.newer(t.dependencies)):
        whitespace = False
        for lineno, line in enumerate(open(filename, 'rU')):
            if lineno == 0 and LEADING_WHITESPACE_RE.match(line):
                t.info('%s:%d: leading whitespace', filename, lineno + 1)
                errors += 1
            if CR_RE.search(line):
                t.info('%s:%d: carriage return character in line', filename, lineno + 1)
                errors += 1
            if TRAILING_WHITESPACE_RE.search(line):
                t.info('%s:%d: trailing whitespace', filename, lineno + 1)
                errors += 1
            if NO_NEWLINE_RE.search(line):
                t.info('%s:%d: no newline at end of file', filename, lineno + 1)
                errors += 1
            whitespace = ALL_WHITESPACE_RE.match(line)
        if whitespace:
            t.info('%s: trailing whitespace at end of file', filename)
            errors += 1
    if errors:
        t.error('%d whitespace errors' % (errors,))
    t.touch()


virtual('apidoc', 'build/jsdoc-%(BRANCH)s-timestamp' % vars(variables))


@target('build/jsdoc-%(BRANCH)s-timestamp' % vars(variables), 'host-resources',
        SRC, SHADER_SRC, ifind('config/jsdoc/api/template'))
def jsdoc_BRANCH_timestamp(t):
    t.run('%(JSDOC)s', 'config/jsdoc/api/index.md',
          '-c', 'config/jsdoc/api/conf.json',
          '-d', 'build/hosted/%(BRANCH)s/apidoc')
    t.touch()


def split_example_file(example, dst_dir):
    lines = open(example, 'rU').readlines()

    target_lines = []
    target_require_lines = []

    found_requires = False
    found_code = False
    for line in lines:
        m = re.match(r'goog.require\(\'(.*)\'\);', line)
        if m:
            found_requires = True
            target_require_lines.append(line)
        elif found_requires:
            if found_code or line not in ('\n', '\r\n'):
                found_code = True
                target_lines.append(line)

    target = open(
        os.path.join(dst_dir, os.path.basename(example)), 'wb')
    target_require = open(
        os.path.join(dst_dir, os.path.basename(example)
          .replace('.js', '-require.js')),
        'wb')

    target.writelines(target_lines)
    target.close()

    target_require.writelines(target_require_lines)
    target_require.close()


@target('host-resources', phony=True)
def host_resources(t):
    resources_dir = 'build/hosted/%(BRANCH)s/resources'
    t.rm_rf(resources_dir)
    t.cp_r('resources', resources_dir)


@target('host-examples', 'build', 'host-resources', 'examples', phony=True)
def host_examples(t):
    examples_dir = 'build/hosted/%(BRANCH)s/examples'
    build_dir = 'build/hosted/%(BRANCH)s/build'
    css_dir = 'build/hosted/%(BRANCH)s/css'
    closure_lib_path = output('node', '-e',
        'process.stdout.write(require("closure-util").getLibraryPath())')
    t.rm_rf(examples_dir)
    t.makedirs(examples_dir)
    t.rm_rf(build_dir)
    t.makedirs(build_dir)
    t.rm_rf(css_dir)
    t.makedirs(css_dir)
    t.cp(EXAMPLES, examples_dir)
    for example in [path.replace('.html', '.js') for path in EXAMPLES]:
        split_example_file(example, examples_dir % vars(variables))
    t.cp_r('examples/data', examples_dir + '/data')
    t.cp('bin/loader_hosted_examples.js', examples_dir + '/loader.js')
    t.cp('build/ol.js', 'build/ol-debug.js', build_dir)
    t.cp('build/ol.css', css_dir)
    t.cp('examples/index.html', 'examples/example-list.js',
         'examples/example-list.xml', 'examples/Jugl.js',
         'examples/jquery.min.js', examples_dir)
    t.rm_rf('build/hosted/%(BRANCH)s/closure-library')
    t.cp_r(closure_lib_path, 'build/hosted/%(BRANCH)s/closure-library')
    t.rm_rf('build/hosted/%(BRANCH)s/ol')
    t.makedirs('build/hosted/%(BRANCH)s/ol')
    t.cp_r('src/ol', 'build/hosted/%(BRANCH)s/ol/ol')
    t.run('%(PYTHON)s', closure_lib_path + '/closure/bin/build/depswriter.py',
          '--root_with_prefix', 'src ../../../ol',
          '--root', 'build/hosted/%(BRANCH)s/closure-library/closure/goog',
          '--root_with_prefix', 'build/hosted/%(BRANCH)s/closure-library/'
          'third_party ../../third_party',
          '--output_file', 'build/hosted/%(BRANCH)s/build/ol-deps.js')


@target('check-examples', 'host-examples', phony=True)
def check_examples(t):
    examples = ['build/hosted/%(BRANCH)s/' + e
                for e in EXAMPLES
                if not open(e.replace('.html', '.js'), 'rU').readline().startswith('// NOCOMPILE')]
    all_examples = \
        [e + '?mode=advanced' for e in examples]
    for example in all_examples:
        t.run('%(PHANTOMJS)s', 'bin/check-example.js', example)


@target('test', phony=True)
def test(t):
    t.run('node', 'tasks/test.js')


@target('fixme', phony=True)
def find_fixme(t):
    regex = re.compile('FIXME|TODO')
    matches = dict()
    totalcount = 0
    for filename in SRC:
        f = open(filename, 'r')
        for lineno, line in enumerate(f):
            if regex.search(line):
                if (filename not in matches):
                    matches[filename] = list()
                matches[filename].append('#%-10d %s' % (
                    lineno + 1, line.strip()))
                totalcount += 1
        f.close()

    for filename in matches:
        num_matches = len(matches[filename])
        noun = 'matches' if num_matches > 1 else 'match'
        print '  %s has %d %s:' % (filename, num_matches, noun)
        for match in matches[filename]:
            print '    %s' % (match,)
        print
    print 'A total of %d TODO/FIXME(s) were found' % (totalcount,)


@target('reallyclean')
def reallyclean(t):
    """Removes untracked files and folders from previous builds."""
    # -X => only clean up files that are usually ignored e.g.
    #       through .gitignore
    # -d => also consider directories for deletion
    # -f => if git configuration variable clean.requireForce != false,
    #       git clean will refuse to run unless given -f or -n.
    t.run('%(GIT)s', 'clean', '-X', '-d', '-f', '.')


@target('checkdeps')
def check_dependencies(t):
    for exe in EXECUTABLES:
        status = 'present' if which(exe) else 'MISSING'
        print 'Program "%s" seems to be %s.' % (exe, status)
    print 'For certain targets all above programs need to be present.'


@target('help')
def display_help(t):
    print '''
build.py - The OpenLayers 3 build script.

Usage:
  ./build.py [options] [target]                         (on Unix-based machines)
  <python-executable.exe> build.py [options] [target]   (on Windows machines)

There is one option:
  -c               - Cleans up the repository from previous builds.

The most common targets are:
  serve            - Serves files, on port 3000.
  lint             - Runs gjslint on all sourcefiles to enforce specific syntax.
  build            - Builds singlefile versions of OpenLayers JavaScript and
                     CSS. This is also the default build target which runs when
                     no target is specified.
  test             - Runs the testsuite and displays the results.
  check            - Runs the lint-target, builds some OpenLayers files, and
                     then runs test. Many developers call this target often
                     while working on the code.
  help             - Shows this help.

Other less frequently used targets are:
  apidoc           - Builds the API-Documentation using JSDoc3.
  ci               - Builds all examples in various modes and usually takes a
                     long time to finish. This target calls the following
                     targets: lint, build, build-all, test, build-examples,
                     check-examples and apidoc. This is the target run on
                     Travis CI.
  reallyclean      - Remove untracked files from the repository.
  checkdeps        - Checks whether all required development software is
                     installed on your machine.
  fixme            - Will print a list of parts of the code that are marked
                     with either TODO or FIXME.
  todo             - This is an alias for the fixme-target (see above).

If no target is given, the build-target will be executed.

The above list is not complete, please see the source code for not-mentioned
and only seldomly called targets.
    '''

if __name__ == '__main__':
    main()
