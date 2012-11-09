#!/usr/bin/env python

from cStringIO import StringIO
import glob
import gzip
import json
import os
import re
import shutil
import sys

import pake

if sys.platform == 'win32':
    pake.variables.GIT = 'C:/Program Files/Git/bin/git.exe'
    pake.variables.GJSLINT = 'gjslint'  # FIXME
    pake.variables.JAVA = 'C:/Program Files/Java/jre7/bin/java.exe'
    pake.variables.JSDOC = 'jsdoc'  # FIXME
    pake.variables.PHANTOMJS = 'phantomjs'  # FIXME
    pake.variables.PYTHON = 'C:/Python27/python.exe'
else:
    pake.variables.GIT = 'git'
    pake.variables.GJSLINT = 'gjslint'
    pake.variables.JAVA = 'java'
    pake.variables.JSDOC = 'jsdoc'
    pake.variables.PHANTOMJS = 'phantomjs'
    pake.variables.PYTHON = 'python'

pake.variables.BRANCH = pake.output('%(GIT)s', 'rev-parse', '--abbrev-ref', 'HEAD').strip()

EXPORTS = [path
           for path in pake.ifind('src')
           if path.endswith('.exports')
           if path != 'src/objectliterals.exports']

EXTERNAL_SRC = [
    'build/src/external/externs/types.js',
    'build/src/external/src/exports.js',
    'build/src/external/src/types.js']

EXAMPLES = [path
            for path in glob.glob('examples/*.html')
            if path != 'examples/example-list.html']

EXAMPLES_SRC = [path
                for path in pake.ifind('examples')
                if path.endswith('.js')
                if not path.endswith('.combined.js')
                if path != 'examples/Jugl.js'
                if path != 'examples/example-list.js']

INTERNAL_SRC = [
    'build/src/internal/src/requireall.js',
    'build/src/internal/src/types.js']

SPEC = [path
        for path in pake.ifind('test/spec')
        if path.endswith('.js')]

SRC = [path
       for path in pake.ifind('src/ol')
       if path.endswith('.js')]

PLOVR_JAR = 'bin/plovr-eba786b34df9.jar'


def report_sizes(t):
    t.info('uncompressed: %d bytes', os.stat(t.name).st_size)
    stringio = StringIO()
    gzipfile = gzip.GzipFile(t.name, 'w', 9, stringio)
    with open(t.name) as f:
        shutil.copyfileobj(f, gzipfile)
    gzipfile.close()
    t.info('  compressed: %d bytes', len(stringio.getvalue()))


pake.virtual('all', 'build-all', 'build', 'examples')


pake.virtual('precommit', 'lint', 'build-all', 'test', 'doc', 'build', 'build-examples')


pake.virtual('build', 'build/ol.css', 'build/ol.js')


@pake.target('build/ol.css', 'build/ol.js')
def build_ol_css(t):
    t.touch()


@pake.target('build/ol.js', PLOVR_JAR, SRC, EXTERNAL_SRC, 'base.json', 'build/ol.json')
def build_ol_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'build/ol.json')
    report_sizes(t)


pake.virtual('build-all', 'build/ol-all.js')


@pake.target('build/ol-all.js', PLOVR_JAR, SRC, INTERNAL_SRC, 'base.json', 'build/ol-all.json')
def build_ol_all_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'build/ol-all.json')


@pake.target('build/src/external/externs/types.js', 'bin/generate-exports.py', 'src/objectliterals.exports')
def build_src_external_externs_types_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py', '--externs', 'src/objectliterals.exports')


@pake.target('build/src/external/src/exports.js', 'bin/generate-exports.py', 'src/objectliterals.exports', EXPORTS)
def build_src_external_src_exports_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py', '--exports', 'src/objectliterals.exports', EXPORTS)


@pake.target('build/src/external/src/types.js', 'bin/generate-exports', 'src/objectliterals.exports')
def build_src_external_src_types_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py', '--typedef', 'src/objectliterals.exports')


@pake.target('build/src/internal/src/requireall.js', SRC)
def build_src_internal_src_requireall_js(t):
    requires = set(('goog.dom',))
    for dependency in t.dependencies:
        for line in open(dependency):
            match = re.match(r'goog\.provide\(\'(.*)\'\);', line)
            if match:
                requires.add(match.group(1))
    with open(t.name, 'w') as f:
        for require in sorted(requires):
            f.write('goog.require(\'%s\');\n' % (require,))


@pake.target('build/src/internal/src/types.js', 'bin/generate-exports.py', 'src/objectliterals.exports')
def build_src_internal_types_js(t):
    t.output('%(PYTHON)s', 'bin/generate-exports.py', '--typedef', 'src/objectliterals.exports')


pake.virtual('build-examples', 'examples', (path.replace('.html', '.combined.js') for path in EXAMPLES))


pake.virtual('examples', 'examples/example-list.js', (path.replace('.html', '.json') for path in EXAMPLES))


@pake.target('examples/example-list.js', 'bin/exampleparser.py', EXAMPLES)
def examples_examples_list_js(t):
    t.run('%(PYTHON)s', 'bin/exampleparser.py', 'examples', 'examples')


@pake.rule(r'\Aexamples/(?P<id>.*).json\Z')
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
    return pake.Target(name, action=action, dependencies=dependencies)


@pake.rule(r'\Aexamples/(?P<id>.*).combined.js\Z')
def examples_star_combined_js(name, match):
    def action(t):
        t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'examples/%(id)s.json' % match.groupdict())
        report_sizes(t)
    dependencies = [PLOVR_JAR, SRC, INTERNAL_SRC, 'base.json', 'examples/%(id)s.js' % match.groupdict(), 'examples/%(id)s.json' % match.groupdict()]
    return pake.Target(name, action=action, dependencies=dependencies)


@pake.target('serve', PLOVR_JAR, INTERNAL_SRC, 'examples')
def serve(t):
    t.run('%(JAVA)s', '-jar', PLOVR_JAR, 'serve', glob.glob('build/*.json'), glob.glob('examples/*.json'))


@pake.target('serve-precommit', PLOVR_JAR, INTERNAL_SRC)
def serve_precommit(t):
    t.run('%(JAVA)s', '-jar', PLOVR_JAR, 'serve', 'build/ol-all.json')


pake.virtual('lint', 'build/lint-src-timestamp', 'build/lint-spec-timestamp')


@pake.target('build/lint-src-timestamp', SRC, INTERNAL_SRC, EXTERNAL_SRC, EXAMPLES_SRC)
def build_lint_src_timestamp(t):
    limited_doc_files = [path
                         for path in pake.ifind('externs', 'build/src/external/externs')
                         if path.endswith('.js')]
    t.run('%(GJSLINT)s', '--strict', '--limited_doc_files=%s' % (','.join(limited_doc_files),), SRC, INTERNAL_SRC, EXTERNAL_SRC, EXAMPLES_SRC)
    t.touch()


@pake.target('build/lint-spec-timestamp', SPEC)
def build_lint_spec_timestamp(t):
    t.run('%(GJSLINT)s', SPEC)
    t.touch()


pake.virtual('plovr', PLOVR_JAR)


@pake.target(PLOVR_JAR, clean=False)
def plovr_jar(t):
    t.download('https://plovr.googlecode.com/files/' + os.path.basename(PLOVR_JAR))


@pake.target('gh-pages', 'hostexamples', 'doc', phony=True)
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


pake.virtual('doc', 'build/jsdoc-%(BRANCH)s-timestamp' % vars(pake.variables))


@pake.target('build/jsdoc-%(BRANCH)s-timestamp' % vars(pake.variables), SRC, pake.ifind('doc/template'))
def jsdoc_BRANCH_timestamp(t):
    t.run('%(JSDOC)s', '-t', 'doc/template', '-r', 'src', '-d', 'build/gh-pages/%(BRANCH)s/apidoc')
    t.touch()


@pake.target('hostexamples', 'build', 'examples', phony=True)
def hostexamples(t):
    t.makedirs('build/gh-pages/%(BRANCH)s/examples')
    t.makedirs('build/gh-pages/%(BRANCH)s/build')
    t.cp(EXAMPLES, (path.replace('.html', '.js') for path in EXAMPLES), 'examples/style.css', 'build/gh-pages/%(BRANCH)s/examples/')
    t.cp('build/loader_hosted_examples.js', 'build/gh-pages/%(BRANCH)s/examples/loader.js')
    t.cp('build/ol.js', 'build/ol.css', 'build/gh-pages/%(BRANCH)s/build/')
    t.cp('examples/example-list.html', 'build/gh-pages/%(BRANCH)s/examples/index.html')
    t.cp('examples/example-list.js', 'examples/example-list.xml', 'examples/Jugl.js', 'build/gh-pages/%(BRANCH)s/examples/')


@pake.target('test', INTERNAL_SRC, phony=True)
def test(t):
    t.run('%(PHANTOMJS)s', 'test/phantom-jasmine/run_jasmine_test.coffee', 'test/ol.html')


if __name__ == '__main__':
    pake.main()
