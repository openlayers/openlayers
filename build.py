#!/usr/bin/env python

from cStringIO import StringIO
import gzip
import json
import os
import os.path
import regex as re
import shutil
import sys

from pake import Target
from pake import ifind, main, output, rule, target, variables, virtual, which


if sys.platform == 'win32':
    """ windows_defaults assumes that jsdoc was installed at a specific place
        (C:\jsdoc). It also fixes a certain version (1.9.0) of phantomjs which
        might not anymore be proposed on
        http://code.google.com/p/phantomjs/downloads/list"""

    windows_defaults = {
        'ProgramFiles': os.environ.get('ProgramFiles', 'C:\\Program Files'),
        'Python27': os.environ.get('SystemDrive', 'C:') + '\\Python27',
        'jsdoc': os.environ.get('SystemDrive', 'C:') + '\\jsdoc3',
        'phantomjs': (os.environ.get('SystemDrive', 'C:') +
                      '\\phantomjs-1.9.0-windows')
    }

    if which('git.exe'):
        variables.GIT = 'git.exe'
    else:
        variables.GIT = os.path.join(windows_defaults['ProgramFiles'],
                                     'Git', 'bin', 'git.exe')

    if which('gjslint.exe'):
        variables.GJSLINT = 'gjslint.exe'
    else:
        variables.GJSLINT = os.path.join(windows_defaults['Python27'],
                                         'Scripts', 'gjslint.exe')

    if which('java.exe'):
        variables.JAVA = 'java.exe'
    else:
        variables.JAVA = os.path.join(windows_defaults['ProgramFiles'],
                                      'Java', 'jre7', 'bin', 'java.exe')

    if which('jar.exe'):
        variables.JAR = 'jar.exe'
    else:
        variables.JAR = os.path.join(windows_defaults['ProgramFiles'],
                                     'Java', 'jdk1.7.0_17', 'bin', 'jar.exe')

    if which('jsdoc.cmd'):
        variables.JSDOC = 'jsdoc.cmd'
    else:
        variables.JSDOC = os.path.join(windows_defaults['jsdoc'],
                                       'jsdoc.cmd')

    if which('python.exe'):
        variables.PYTHON = 'python.exe'
    else:
        variables.PYTHON = os.path.join(windows_defaults['Python27'],
                                        'python.exe')

    if which('phantomjs.exe'):
        variables.PHANTOMJS = 'phantomjs.exe'
    else:
        variables.PHANTOMJS = os.path.join(windows_defaults['phantomjs'],
                                           'phantomjs.exe')

else:
    variables.GIT = 'git'
    variables.GJSLINT = 'gjslint'
    if sys.platform == 'darwin':
        variables.JAVA = '/Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java'
    else:
        variables.JAVA = 'java'
    variables.JAR = 'jar'
    variables.JSDOC = 'jsdoc'
    variables.NODE = 'node'
    variables.PYTHON = 'python'
    variables.PHANTOMJS = 'phantomjs'

TEMPLATE_GLSL_COMPILER_JS = 'build/glsl-unit/bin/template_glsl_compiler.js'

variables.BRANCH = output(
    '%(GIT)s', 'rev-parse', '--abbrev-ref', 'HEAD').strip()

EXECUTABLES = [variables.GIT, variables.GJSLINT, variables.JAVA, variables.JAR,
               variables.JSDOC, variables.PYTHON, variables.PHANTOMJS]

EXPORTS = [path
           for path in ifind('src')
           if path.endswith('.exports')]

EXTERNAL_SRC = [
    'build/src/external/externs/types.js',
    'build/src/external/src/exports.js',
    'build/src/external/src/types.js']

EXAMPLES = [path
            for path in ifind('examples')
            if path.endswith('.html')
            if path != 'examples/index.html']

EXAMPLES_SRC = [path
                for path in ifind('examples')
                if path.endswith('.js')
                if not path.endswith('.combined.js')
                if not path.startswith('examples/bootstrap')
                if not path.startswith('examples/font-awesome')
                if path != 'examples/Jugl.js'
                if path != 'examples/jquery.min.js'
                if path != 'examples/loader.js'
                if path != 'examples/example-list.js']

EXAMPLES_JSON = ['build/' + example.replace('.html', '.json')
                 for example in EXAMPLES]

EXAMPLES_COMBINED = ['build/' + example.replace('.html', '.combined.js')
                     for example in EXAMPLES]

INTERNAL_SRC = [
    'build/src/internal/src/requireall.js',
    'build/src/internal/src/types.js']

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

SRC = [path
       for path in ifind('src/ol')
       if path.endswith('.js')
       if path not in SHADER_SRC]

PLOVR_JAR = 'build/plovr-81ed862.jar'
PLOVR_JAR_MD5 = '1c752daaf11ad6220b298e7d2ee2b87d'

PROJ4JS = 'build/proj4js/lib/proj4js-combined.js'
PROJ4JS_ZIP = 'build/proj4js-1.1.0.zip'
PROJ4JS_ZIP_MD5 = '17caad64cf6ebc6e6fe62f292b134897'


def report_sizes(t):
    t.info('uncompressed: %d bytes', os.stat(t.name).st_size)
    stringio = StringIO()
    gzipfile = gzip.GzipFile(t.name, 'w', 9, stringio)
    with open(t.name) as f:
        shutil.copyfileobj(f, gzipfile)
    gzipfile.close()
    t.info('  compressed: %d bytes', len(stringio.getvalue()))


virtual('default', 'build')


virtual('integration-test', 'lint', 'build', 'build-all',
        'test', 'build-examples', 'check-examples', 'doc')


virtual('build', 'build/ol.css', 'build/ol.js',
        'build/ol-simple.js', 'build/ol-whitespace.js')


virtual('check', 'lint', 'build/ol.css', 'build/ol-all.js', 'test')


virtual('todo', 'fixme')


@target('build/ol.css', 'build/ol.js')
def build_ol_css(t):
    t.touch()


@target('build/ol.js', PLOVR_JAR, SRC, EXTERNAL_SRC, SHADER_SRC,
        'buildcfg/base.json', 'buildcfg/ol.json')
def build_ol_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ol.json')
    report_sizes(t)


@target('build/ol-simple.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        'buildcfg/base.json', 'buildcfg/ol.json', 'buildcfg/ol-simple.json')
def build_ol_simple_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ol-simple.json')
    report_sizes(t)


@target('build/ol-whitespace.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        'buildcfg/base.json', 'buildcfg/ol.json',
        'buildcfg/ol-whitespace.json')
def build_ol_whitespace_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR,
             'build', 'buildcfg/ol-whitespace.json')
    report_sizes(t)


virtual('build-all', 'build/ol-all.js')


@target('build/ol-all.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        'buildcfg/base.json', 'buildcfg/ol-all.json')
def build_ol_all_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ol-all.json')


@target('build/src/external/externs/types.js', 'bin/generate-exports.py',
        'src/objectliterals.jsdoc')
def build_src_external_externs_types_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py',
             '--externs', 'src/objectliterals.jsdoc')


@target('build/src/external/src/exports.js', 'bin/generate-exports.py',
        'src/objectliterals.jsdoc', EXPORTS)
def build_src_external_src_exports_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py',
             '--exports', 'src/objectliterals.jsdoc', EXPORTS)


@target('build/src/external/src/types.js', 'bin/generate-exports.py',
        'src/objectliterals.jsdoc')
def build_src_external_src_types_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py',
             '--typedef', 'src/objectliterals.jsdoc')


if os.path.exists(TEMPLATE_GLSL_COMPILER_JS):
    for glsl_src in GLSL_SRC:
        def shader_src_helper(glsl_src):
            @target(glsl_src.replace('.glsl', 'shader.js'), glsl_src,
                    'src/ol/webgl/shader.mustache')
            def shader_src(t):
                t.run('%(NODE)s', TEMPLATE_GLSL_COMPILER_JS,
                      '--input', glsl_src,
                      '--template', 'src/ol/webgl/shader.mustache',
                      '--output', t.name)
        shader_src_helper(glsl_src)


def _build_require_list(dependencies, output_file_name):
    requires = set()
    for dependency in dependencies:
        for line in open(dependency):
            match = re.match(r'goog\.provide\(\'(.*)\'\);', line)
            if match:
                requires.add(match.group(1))
    with open(output_file_name, 'w') as f:
        for require in sorted(requires):
            f.write('goog.require(\'%s\');\n' % (require,))


@target('build/src/internal/src/requireall.js', SRC, SHADER_SRC)
def build_src_internal_src_requireall_js(t):
    _build_require_list(t.dependencies, t.name)


@target('build/test/requireall.js', SPEC)
def build_test_requireall_js(t):
    _build_require_list(t.dependencies, t.name)


@target('build/src/internal/src/types.js', 'bin/generate-exports.py',
        'src/objectliterals.jsdoc')
def build_src_internal_types_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py',
             '--typedef', 'src/objectliterals.jsdoc')


virtual('build-examples', 'examples', EXAMPLES_COMBINED)


virtual('examples', 'examples/example-list.xml', EXAMPLES_JSON)


@target('examples/example-list.xml', 'examples/example-list.js')
def examples_examples_list_xml(t):
    t.touch()  # already generated by bin/exampleparser.py


@target('examples/example-list.js', 'bin/exampleparser.py', EXAMPLES)
def examples_examples_list_js(t):
    t.run('%(PYTHON)s', 'bin/exampleparser.py', 'examples', 'examples')


@rule(r'\Abuild/examples/(?P<id>.*).json\Z')
def examples_star_json(name, match):
    def action(t):
        content = json.dumps({
            'id': match.group('id'),
            'inherits': '../../buildcfg/base.json',
            'inputs': [
                '../examples/%(id)s.js' % match.groupdict(),
                '../build/src/internal/src/types.js',
            ],
            'externs': [
                '//json.js',
                '//jquery-1.7.js',
                '../externs/bingmaps.js',
                '../externs/bootstrap.js',
                '../externs/geojson.js',
                '../externs/topojson.js',
                '../externs/oli.js',
                '../externs/proj4js.js',
                '../externs/tilejson.js',
                '../externs/closure-compiler.js',
            ],
        })
        with open(t.name, 'w') as f:
            f.write(content)
    dependencies = [__file__, 'buildcfg/base.json']
    return Target(name, action=action, dependencies=dependencies)


@rule(r'\Abuild/examples/(?P<id>.*).combined.js\Z')
def examples_star_combined_js(name, match):
    def action(t):
        t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build',
                 'build/examples/%(id)s.json' % match.groupdict())
        report_sizes(t)
    dependencies = [PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
                    'buildcfg/base.json',
                    'examples/%(id)s.js' % match.groupdict(),
                    'build/examples/%(id)s.json' % match.groupdict()]
    return Target(name, action=action, dependencies=dependencies)


@target('serve', PLOVR_JAR, 'test-deps', 'examples')
def serve(t):
    t.run('%(JAVA)s', '-jar', PLOVR_JAR, 'serve', 'buildcfg/ol.json',
          'buildcfg/ol-all.json', EXAMPLES_JSON, 'buildcfg/test.json')


@target('serve-integration-test', PLOVR_JAR, INTERNAL_SRC)
def serve_precommit(t):
    t.run('%(JAVA)s', '-jar', PLOVR_JAR, 'serve',
          'buildcfg/ol-all.json', 'buildcfg/test.json')


virtual('lint', 'build/lint-timestamp', 'build/lint-generated-timestamp',
        'build/check-requires-timestamp', 'build/check-whitespace-timestamp')


@target('build/lint-timestamp', SRC, EXAMPLES_SRC, SPEC, precious=True)
def build_lint_src_timestamp(t):
    t.run('%(GJSLINT)s',
          '--jslint_error=all',
          '--strict',
          t.newer(t.dependencies))
    t.touch()


@target('build/lint-generated-timestamp', INTERNAL_SRC, EXTERNAL_SRC,
        precious=True)
def build_lint_generated_timestamp(t):
    limited_doc_files = [
        path
        for path in ifind('externs', 'build/src/external/externs')
        if path.endswith('.js')]
    t.run('%(GJSLINT)s',
          '--jslint_error=all',
          # ignore error for max line length (for these auto-generated sources)
          '--disable=110',
          # for a complete list of error codes to allow, see
          # http://closure-linter.googlecode.com/svn/trunk/closure_linter/errors.py
          '--limited_doc_files=%s' % (','.join(limited_doc_files),),
          '--strict',
          t.newer(t.dependencies))
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


@target('build/check-requires-timestamp', SRC, INTERNAL_SRC, EXTERNAL_SRC,
        EXAMPLES_SRC, SHADER_SRC, SPEC)
def build_check_requires_timestamp(t):
    from zipfile import ZipFile
    unused_count = 0
    all_provides = set()
    zf = ZipFile(PLOVR_JAR)
    for zi in zf.infolist():
        if zi.filename.endswith('.js'):
            if not zi.filename.startswith('closure/goog/'):
                continue
            # Skip goog.i18n because it contains so many modules that it causes
            # the generated regular expression to exceed Python's limits
            if zi.filename.startswith('closure/goog/i18n/'):
                continue
            for line in zf.open(zi):
                m = re.match(r'goog.provide\(\'(.*)\'\);', line)
                if m:
                    all_provides.add(m.group(1))
    for filename in sorted(t.dependencies):
        if filename == 'build/src/internal/src/requireall.js':
            continue
        require_linenos = {}
        uses = set()
        lines = open(filename).readlines()
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
        if filename in INTERNAL_SRC or filename in EXTERNAL_SRC:
            continue
        provides = set()
        requires = set()
        uses = set()
        uses_linenos = {}
        for lineno, line in _strip_comments(open(filename)):
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


@target('build/check-whitespace-timestamp', SRC, INTERNAL_SRC, EXTERNAL_SRC,
        EXAMPLES_SRC, SPEC, EXPORTS, JSDOC_SRC,
        precious=True)
def build_check_whitespace_timestamp(t):
    CR_RE = re.compile(r'\r')
    TRAILING_WHITESPACE_RE = re.compile(r'\s+\n\Z')
    NO_NEWLINE_RE = re.compile(r'[^\n]\Z')
    ALL_WHITESPACE_RE = re.compile(r'\s+\Z')
    errors = 0
    for filename in sorted(t.newer(t.dependencies)):
        whitespace = False
        for lineno, line in enumerate(open(filename)):
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


virtual('plovr', PLOVR_JAR)


@target(PLOVR_JAR, clean=False)
def plovr_jar(t):
    t.info('downloading %r', t.name)
    t.download('https://plovr.googlecode.com/files/' +
               os.path.basename(PLOVR_JAR), md5=PLOVR_JAR_MD5)
    t.info('downloaded %r', t.name)


virtual('doc', 'build/jsdoc-%(BRANCH)s-timestamp' % vars(variables))


@target('build/jsdoc-%(BRANCH)s-timestamp' % vars(variables), 'host-resources',
        'build/src/external/src/exports.js', 'build/src/external/src/types.js',
        SRC, SHADER_SRC, ifind('doc/template'))
def jsdoc_BRANCH_timestamp(t):
    t.run('%(JSDOC)s', '-c', 'doc/conf.json', 'src', 'doc/index.md',
          '-d', 'build/hosted/%(BRANCH)s/apidoc')
    t.touch()


def split_example_file(example, dst_dir):
    lines = open(example).readlines()

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
        os.path.join(dst_dir, os.path.basename(example)), 'w')
    target_require = open(
        os.path.join(dst_dir, os.path.basename(example)
          .replace('.js', '-require.js')),
        'w')

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
    t.rm_rf(examples_dir)
    t.makedirs(examples_dir)
    t.rm_rf(build_dir)
    t.makedirs(build_dir)
    t.cp(EXAMPLES, examples_dir)
    for example in [path.replace('.html', '.js') for path in EXAMPLES]:
        split_example_file(example, examples_dir % vars(variables))
    t.cp_r('examples/data', examples_dir + '/data')
    t.cp('bin/loader_hosted_examples.js', examples_dir + '/loader.js')
    t.cp('build/ol.js', 'build/ol-simple.js', 'build/ol-whitespace.js',
         'build/ol.css', build_dir)
    t.cp('examples/index.html', 'examples/example-list.js',
         'examples/example-list.xml', 'examples/Jugl.js',
         'examples/jquery.min.js', examples_dir)
    t.rm_rf('build/hosted/%(BRANCH)s/closure-library')
    t.makedirs('build/hosted/%(BRANCH)s/closure-library')
    with t.chdir('build/hosted/%(BRANCH)s/closure-library'):
        t.run('%(JAR)s', 'xf', '../../../../' + PLOVR_JAR, 'closure')
        t.run('%(JAR)s', 'xf', '../../../../' + PLOVR_JAR, 'third_party')
    t.rm_rf('build/hosted/%(BRANCH)s/ol')
    t.makedirs('build/hosted/%(BRANCH)s/ol')
    t.cp_r('src/ol', 'build/hosted/%(BRANCH)s/ol/ol')
    t.run('%(PYTHON)s', 'bin/closure/depswriter.py',
          '--root_with_prefix', 'src ../../../ol',
          '--root', 'build/hosted/%(BRANCH)s/closure-library/closure/goog',
          '--root_with_prefix', 'build/hosted/%(BRANCH)s/closure-library/'
          'third_party ../../third_party',
          '--output_file', 'build/hosted/%(BRANCH)s/build/ol-deps.js')


@target('check-examples', 'host-examples', phony=True)
def check_examples(t):
    examples = ['build/hosted/%(BRANCH)s/' + e for e in EXAMPLES]
    all_examples = \
        [e + '?mode=advanced' for e in examples]
    for example in all_examples:
        t.run('%(PHANTOMJS)s', 'bin/check-example.js', example)


@target(PROJ4JS, PROJ4JS_ZIP)
def proj4js(t):
    from zipfile import ZipFile
    zf = ZipFile(PROJ4JS_ZIP)
    contents = zf.open('proj4js/lib/proj4js-combined.js').read()
    with open(t.name, 'wb') as f:
        f.write(contents)


@target(PROJ4JS_ZIP, clean=False)
def proj4js_zip(t):
    t.info('downloading %r', t.name)
    t.download('http://download.osgeo.org/proj4js/' +
               os.path.basename(t.name), md5=PROJ4JS_ZIP_MD5)
    t.info('downloaded %r', t.name)


virtual('test-deps', INTERNAL_SRC, PROJ4JS, 'build/test/requireall.js')


@target('test', 'test-deps', phony=True)
def test(t):
    t.run('%(PHANTOMJS)s', 'test/mocha-phantomjs.coffee', 'test/ol.html')


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


if __name__ == '__main__':
    main()
