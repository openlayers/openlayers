#!/usr/bin/env python

from cStringIO import StringIO
import gzip
import json
import os
import os.path
import re
import shutil
import sys

from pake import Target, ifind, main, output, rule, target, variables, virtual


if sys.platform == 'win32':
    ProgramFiles = os.environ.get('ProgramFiles', 'C:\\Program Files')
    ProgramFiles_X86 = os.environ.get('ProgramFiles(X86)', 'C:\\Program Files')
    Python27 = os.environ.get('SystemDrive', 'C:') + '\\Python27'
    variables.GIT = os.path.join(ProgramFiles_X86, 'Git', 'bin', 'git.exe')
    variables.GJSLINT = os.path.join(Python27, 'Scripts', 'gjslint.exe')
    variables.JAVA = os.path.join(ProgramFiles, 'Java', 'jre7', 'bin', 'java.exe')
    variables.JSDOC = 'jsdoc'  # FIXME
    variables.PYTHON = os.path.join(Python27, 'python.exe')
    PHANTOMJS_WINDOWS_ZIP = 'build/phantomjs-1.8.1-windows.zip'
    # FIXME we should not need both a pake variable and a Python constant here
    # FIXME this requires pake to be modified to lazily evaluate variables in target names
    variables.PHANTOMJS = 'build/phantomjs-1.8.1-windows/phantomjs.exe'
    PHANTOMJS = variables.PHANTOMJS
else:
    variables.GIT = 'git'
    variables.GJSLINT = 'gjslint'
    variables.JAVA = 'java'
    variables.JSDOC = 'jsdoc'
    variables.PYTHON = 'python'
    variables.PHANTOMJS = 'phantomjs'

variables.BRANCH = output('%(GIT)s', 'rev-parse', '--abbrev-ref', 'HEAD').strip()

EXPORTS = [path
           for path in ifind('src')
           if path.endswith('.exports')
           if path != 'src/objectliterals.exports']

EXTERNAL_SRC = [
    'build/src/external/externs/types.js',
    'build/src/external/src/exports.js',
    'build/src/external/src/types.js']

EXAMPLES = [path
            for path in ifind('examples')
            if not path.startswith('examples/standalone/')
            if path.endswith('.html')
            if path != 'examples/example-list.html']

EXAMPLES_JSON = [example.replace('.html', '.json')
                 for example in EXAMPLES]

EXAMPLES_SRC = [path
                for path in ifind('examples')
                if path.endswith('.js')
                if not path.endswith('.combined.js')
                if path != 'examples/Jugl.js'
                if path != 'examples/example-list.js']

INTERNAL_SRC = [
    'build/src/internal/src/requireall.js',
    'build/src/internal/src/types.js']

SPEC = [path
        for path in ifind('test/spec')
        if path.endswith('.js')]

SRC = [path
       for path in ifind('src/ol')
       if path.endswith('.js')]

PLOVR_JAR = 'bin/plovr-eba786b34df9.jar'
PLOVR_JAR_MD5 = '20eac8ccc4578676511cf7ccbfc65100'

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


virtual('all', 'build-all', 'build', 'examples', 'precommit')


virtual('precommit', 'lint', 'build-all', 'test', 'build', 'build-examples', 'doc')


virtual('build', 'build/ol.css', 'build/ol.js', 'build/ol-simple.js', 'build/ol-whitespace.js')


virtual('todo', 'fixme')


@target('build/ol.css', 'build/ol.js')
def build_ol_css(t):
    t.touch()


@target('build/ol.js', PLOVR_JAR, SRC, EXTERNAL_SRC, 'base.json', 'build/ol.json')
def build_ol_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'build/ol.json')
    report_sizes(t)


@target('build/ol-simple.js', PLOVR_JAR, SRC, EXTERNAL_SRC, 'base.json', 'build/ol.json', 'build/ol-simple.json')
def build_ol_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'build/ol-simple.json')
    report_sizes(t)


@target('build/ol-whitespace.js', PLOVR_JAR, SRC, EXTERNAL_SRC, 'base.json', 'build/ol.json', 'build/ol-whitespace.json')
def build_ol_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'build/ol-whitespace.json')
    report_sizes(t)


virtual('build-all', 'build/ol-all.js')


@target('build/ol-all.js', PLOVR_JAR, SRC, INTERNAL_SRC, 'base.json', 'build/ol-all.json')
def build_ol_all_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'build/ol-all.json')


@target('build/src/external/externs/types.js', 'bin/generate-exports.py', 'src/objectliterals.exports')
def build_src_external_externs_types_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py', '--externs', 'src/objectliterals.exports')


@target('build/src/external/src/exports.js', 'bin/generate-exports.py', 'src/objectliterals.exports', EXPORTS)
def build_src_external_src_exports_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py', '--exports', 'src/objectliterals.exports', EXPORTS)


@target('build/src/external/src/types.js', 'bin/generate-exports', 'src/objectliterals.exports')
def build_src_external_src_types_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py', '--typedef', 'src/objectliterals.exports')


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


@target('build/src/internal/src/requireall.js', SRC)
def build_src_internal_src_requireall_js(t):
    _build_require_list(t.dependencies, t.name)


@target('test/requireall.js', SPEC)
def build_test_requireall_js(t):
    _build_require_list(t.dependencies, t.name)


@target('build/src/internal/src/types.js', 'bin/generate-exports.py', 'src/objectliterals.exports')
def build_src_internal_types_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py', '--typedef', 'src/objectliterals.exports')


virtual('build-examples', 'examples', (path.replace('.html', '.combined.js') for path in EXAMPLES))


virtual('examples', 'examples/example-list.xml', (path.replace('.html', '.json') for path in EXAMPLES))


@target('examples/example-list.xml', 'examples/example-list.js')
def examples_examples_list_xml(t):
    t.touch()  # already generated by bin/exampleparser.py


@target('examples/example-list.js', 'bin/exampleparser.py', EXAMPLES)
def examples_examples_list_js(t):
    t.run('%(PYTHON)s', 'bin/exampleparser.py', 'examples', 'examples')


@rule(r'\Aexamples/(?P<id>.*).json\Z')
def examples_star_json(name, match):
    def action(t):
        content = json.dumps({
            'id': match.group('id'),
            'inherits': '../base.json',
            'inputs': [
                'examples/%(id)s.js' % match.groupdict(),
                'build/src/internal/src/types.js',
            ],
        })
        with open(t.name, 'w') as f:
            f.write(content)
    dependencies = [__file__, 'base.json']
    return Target(name, action=action, dependencies=dependencies)


@rule(r'\Aexamples/(?P<id>.*).combined.js\Z')
def examples_star_combined_js(name, match):
    def action(t):
        t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'examples/%(id)s.json' % match.groupdict())
        report_sizes(t)
    dependencies = [PLOVR_JAR, SRC, INTERNAL_SRC, 'base.json', 'examples/%(id)s.js' % match.groupdict(), 'examples/%(id)s.json' % match.groupdict()]
    return Target(name, action=action, dependencies=dependencies)


@target('serve', PLOVR_JAR, INTERNAL_SRC, 'test/requireall.js', 'examples')
def serve(t):
    t.run('%(JAVA)s', '-jar', PLOVR_JAR, 'serve', 'build/ol.json', 'build/ol-all.json', EXAMPLES_JSON, 'test/test.json')


@target('serve-precommit', PLOVR_JAR, INTERNAL_SRC)
def serve_precommit(t):
    t.run('%(JAVA)s', '-jar', PLOVR_JAR, 'serve', 'build/ol-all.json', 'test/test.json')


virtual('lint', 'build/lint-src-timestamp', 'build/lint-spec-timestamp', 'build/check-requires-timestamp')


@target('build/lint-src-timestamp', SRC, INTERNAL_SRC, EXTERNAL_SRC, EXAMPLES_SRC, precious=True)
def build_lint_src_timestamp(t):
    limited_doc_files = [path
                         for path in ifind('externs', 'build/src/external/externs')
                         if path.endswith('.js')]
    t.run('%(GJSLINT)s', '--strict', '--limited_doc_files=%s' % (','.join(limited_doc_files),), t.newer(SRC, INTERNAL_SRC, EXTERNAL_SRC, EXAMPLES_SRC))
    t.touch()


def _strip_comments(lines):
    # FIXME this is a horribe hack, we should use a proper JavaScript parser here
    in_comment = False
    for line in lines:
        if in_comment:
            index = line.find('*/')
            if index != -1:
                in_comment = False
                yield line[index + 2:]
        else:
            index = line.find('/*')
            if index != -1:
                yield line[:index]
                in_comment = True
            else:
                index = line.find('//')
                if index != -1:
                    yield line[:index]
                else:
                    yield line


@target('build/check-requires-timestamp', SRC, INTERNAL_SRC, EXTERNAL_SRC, EXAMPLES_SRC)
def build_check_requires_timestamp(t):
    unused_count = 0
    all_provides = set()
    for filename in sorted(t.dependencies):
        if filename == 'build/src/internal/src/requireall.js':
            continue
        require_linenos = {}
        uses = set()
        lineno = 0
        for line in open(filename):
            lineno += 1
            m = re.match(r'goog.provide\(\'(.*)\'\);', line)
            if m:
                all_provides.add(m.group(1))
                continue
            m = re.match(r'goog.require\(\'(.*)\'\);', line)
            if m:
                require_linenos[m.group(1)] = lineno
                continue
            for require in require_linenos.iterkeys():
                if require in line:
                    uses.add(require)
        for require in sorted(set(require_linenos.keys()) - uses):
            t.info('%s:%d: unused goog.require: %r' % (filename, require_linenos[require], require))
            unused_count += 1
    all_provides.discard('ol')
    all_provides.discard('ol.Map')
    all_provides.discard('ol.MapProperty')
    provide_res = dict((provide, re.compile(r'\b%s\b' % (re.escape(provide)),)) for provide in all_provides)
    missing_count = 0
    for filename in sorted(t.dependencies):
        if filename in INTERNAL_SRC or filename in EXTERNAL_SRC:
            continue
        provides = set()
        requires = set()
        uses = set()
        lineno = 0
        for line in _strip_comments(open(filename)):
            lineno += 1
            m = re.match(r'goog.provide\(\'(.*)\'\);', line)
            if m:
                provides.add(m.group(1))
                continue
            m = re.match(r'goog.require\(\'(.*)\'\);', line)
            if m:
                requires.add(m.group(1))
                continue
            for provide, provide_re in provide_res.iteritems():
                if provide_re.search(line):
                    uses.add(provide)
        if filename == 'src/ol/renderer/layerrenderer.js':
            uses.discard('ol.renderer.Map')
        m = re.match(r'src/ol/renderer/(\w+)/\1(\w*)layerrenderer\.js\Z', filename)
        if m:
            uses.discard('ol.renderer.Map')
            uses.discard('ol.renderer.%s.Map' % (m.group(1),))
        missing_requires = uses - requires - provides
        if missing_requires:
            t.info('%s: missing goog.requires: %s', filename, ', '.join(sorted(missing_requires)))
            missing_count += len(missing_requires)
    if unused_count or missing_count:
        t.error('%d unused goog.requires, %d missing goog.requires' % (unused_count, missing_count))
    t.touch()


@target('build/lint-spec-timestamp', SPEC, precious=True)
def build_lint_spec_timestamp(t):
    t.run('%(GJSLINT)s', t.newer(SPEC))
    t.touch()


virtual('plovr', PLOVR_JAR)


@target(PLOVR_JAR, clean=False)
def plovr_jar(t):
    t.download('https://plovr.googlecode.com/files/' + os.path.basename(PLOVR_JAR), md5=PLOVR_JAR_MD5)


@target('gh-pages', 'hostexamples', 'doc', phony=True)
def gh_pages(t):
    with t.tempdir() as tempdir:
        t.run('%(GIT)s', 'clone', '--branch', 'gh-pages', 'git@github.com:openlayers/ol3.git', tempdir)
        with t.chdir(tempdir):
            t.rm_rf('%(BRANCH)s')
        t.cp_r('build/gh-pages/%(BRANCH)s', tempdir + '/%(BRANCH)s')
        with t.chdir(tempdir):
            t.run('%(GIT)s', 'add', '--all', '%(BRANCH)s')
            t.run('%(GIT)s', 'commit', '--message', 'Updated')
            t.run('%(GIT)s', 'push', 'origin', 'gh-pages')


virtual('doc', 'build/jsdoc-%(BRANCH)s-timestamp' % vars(variables))


@target('build/jsdoc-%(BRANCH)s-timestamp' % vars(variables), SRC, ifind('doc/template'))
def jsdoc_BRANCH_timestamp(t):
    t.run('%(JSDOC)s', '-t', 'doc/template', '-r', 'src', '-d', 'build/gh-pages/%(BRANCH)s/apidoc')
    t.touch()


@target('hostexamples', 'build', 'examples', phony=True)
def hostexamples(t):
    t.makedirs('build/gh-pages/%(BRANCH)s/examples')
    t.makedirs('build/gh-pages/%(BRANCH)s/build')
    t.cp(EXAMPLES, (path.replace('.html', '.js') for path in EXAMPLES), 'examples/style.css', 'build/gh-pages/%(BRANCH)s/examples/')
    t.rm_rf('build/gh-pages/%(BRANCH)s/examples/data')
    t.cp_r('examples/data', 'build/gh-pages/%(BRANCH)s/examples/data')
    t.cp('build/loader_hosted_examples.js', 'build/gh-pages/%(BRANCH)s/examples/loader.js')
    t.cp('build/ol.js', 'build/ol-simple.js', 'build/ol-whitespace.js', 'build/ol.css', 'build/gh-pages/%(BRANCH)s/build/')
    t.cp('examples/example-list.html', 'build/gh-pages/%(BRANCH)s/examples/index.html')
    t.cp('examples/example-list.js', 'examples/example-list.xml', 'examples/Jugl.js', 'build/gh-pages/%(BRANCH)s/examples/')


@target(PROJ4JS, PROJ4JS_ZIP)
def proj4js(t):
    from zipfile import ZipFile
    zf = ZipFile(PROJ4JS_ZIP)
    contents = zf.open('proj4js/lib/proj4js-combined.js').read()
    with open(t.name, 'wb') as f:
        f.write(contents)


@target(PROJ4JS_ZIP, clean=False)
def proj4js_zip(t):
    t.download('http://download.osgeo.org/proj4js/' + os.path.basename(t.name), md5=PROJ4JS_ZIP_MD5)


if sys.platform == 'win32':
    @target('test', '%(PHANTOMJS)s', INTERNAL_SRC, PROJ4JS, 'test/requireall.js', phony=True)
    def test(t):
        t.run(PHANTOMJS, 'test/phantom-jasmine/run_jasmine_test.coffee', 'test/ol.html')

    # FIXME the PHANTOMJS should be a pake variable, not a constant
    @target(PHANTOMJS, PHANTOMJS_WINDOWS_ZIP, clean=False)
    def phantom_js(t):
        from zipfile import ZipFile
        ZipFile(PHANTOMJS_WINDOWS_ZIP).extractall('build')

    @target(PHANTOMJS_WINDOWS_ZIP, clean=False)
    def phantomjs_windows_zip(t):
        t.download('http://phantomjs.googlecode.com/files/' + os.path.basename(t.name))

else:
    @target('test', INTERNAL_SRC, PROJ4JS, 'test/requireall.js', phony=True)
    def test(t):
        t.run('%(PHANTOMJS)s', 'test/phantom-jasmine/run_jasmine_test.coffee', 'test/ol.html')


@target('fixme', phony=True)
def find_fixme(t):
    regex = re.compile(".(FIXME|TODO).")
    matches = dict()
    totalcount = 0
    for filename in SRC:
        f = open(filename, 'r')
        for lineno, line in enumerate(f):
            if regex.search(line):
                if (filename not in matches):
                    matches[filename] = list()
                matches[filename].append("#" + str(lineno + 1).ljust(10) + line.strip())
                totalcount += 1
        f.close()

    for filename in matches:
        print "  ", filename, "has", len(matches[filename]), "matches:"
        for match in matches[filename]:
            print "    ", match
        print
    print "A total number of", totalcount, "TODO/FIXME was found"


@target('reallyclean')
def reallyclean(t):
    """Removes untracked files and folders from previous builds."""
    # -X => only clean up files that are usually ignored e.g.
    #       through .gitignore
    # -d => also consider directories for deletion
    # -f => if git configuration variable clean.requireForce != false,
    #       git clean will refuse to run unless given -f or -n.
    t.run('%(GIT)s', 'clean', '-X', '-d', '-f', '.')


if __name__ == '__main__':
    main()
