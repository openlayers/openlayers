#!/usr/bin/env python

CLOSURE_COMPILER = 'build/closure-compiler'
CLOSURE_LIBRARY = 'build/closure-library'
COMPILER_JAR = 'build/compiler.jar'

import json
from optparse import OptionParser
import os
import os.path
import subprocess
import sys

sys.path.append(os.path.join(CLOSURE_LIBRARY, 'closure', 'bin', 'build'))

import depstree
import source
import treescan


COMPILATION_LEVEL = {
    'ADVANCED': 'ADVANCED_OPTIMIZATIONS',
    'SIMPLE': 'SIMPLE_OPTIMIZATIONS',
    'WHITESPACE': 'WHITESPACE_ONLY'
}


class _PathSource(source.Source):
  """Source file subclass that remembers its file path."""

  def __init__(self, path):
    """Initialize a source.

    Args:
      path: str, Path to a JavaScript file.  The source string will be read
        from this file.
    """
    super(_PathSource, self).__init__(source.GetFileContents(path))

    self._path = path

  def GetPath(self):
    """Returns the path."""
    return self._path


def _IsClosureBaseFile(js_source):
  """Returns true if the given _PathSource is the Closure base.js source."""
  return (os.path.basename(js_source.GetPath()) == 'base.js' and
          js_source.provides == set(['goog']))


def javascript(value):
    if value is False:
        return 'false'
    elif value is True:
        return 'true'
    else:
        return unicode(value)


def normpath(base):
    dirname = os.path.dirname(base)
    def f(path):
        if path.startswith('//'):
            return os.path.join(CLOSURE_COMPILER, 'contrib', 'externs', path[2:])
        else:
            return os.path.normpath(os.path.join(dirname, path))
    return f


def load_config(path):
    config = {}
    while True:
        n = normpath(path)
        for key, value in json.load(open(path)).iteritems():
            if key not in config:
                if key in ('externs', 'inputs', 'paths'):
                    value = map(n, value)
                config[key] = value
        if 'inherits' in config:
            path = n(config['inherits'])
            del config['inherits']
        else:
            return config


def build(config):

    args = ['java', '-client', '-jar', COMPILER_JAR]

    if 'ambiguate-properties' in config and 'disambiguate-properties' in config:
        args.append('--use_types_for_optimization')
    if 'checks' in config:
        for key, value in config['checks'].iteritems():
            args.append('--jscomp_%s=%s' % (value.lower(), key))
    if 'define' in config:
        for key, value in config['define'].iteritems():
            args.append('--define=%s=%s' % (key, javascript(value)))
    if 'externs' in config:
        for extern in config['externs']:
            if False:  # FIXME
                if extern.startswith('//'):
                    extern = os.path.join(CLOSURE_COMPILER, 'externs', extern[2:])
            args.append('--externs=%s' % (extern,))
    if 'level' in config:
        args.append('--warning_level=%s' % (config['level'],))
    if 'mode' in config:
        args.append('--compilation_level=%s' % (COMPILATION_LEVEL[config['mode']]),)
    if 'output-wrapper' in config:
        args.append('--output_wrapper=%s' % (config['output-wrapper'],))

    sources = set()

    roots = set()
    roots.add(os.path.join(CLOSURE_LIBRARY, 'closure'))
    roots.add(os.path.join(CLOSURE_LIBRARY, 'third_party', 'closure'))
    if 'paths' in config:
        roots.update(config['paths'])
    for path in roots:
        for js_path in treescan.ScanTreeForJsFiles(path):
            sources.add(_PathSource(js_path))
    tree = depstree.DepsTree(sources)

    input_sources = [_PathSource(input) for input in config['inputs']]

    input_namespaces = set()
    for input_source in input_sources:
        input_namespaces.update(input_source.requires)
    deps = tree.GetDependencies(input_namespaces)

    args.append('--js')
    args.append(os.path.join(CLOSURE_LIBRARY, 'closure', 'goog', 'base.js'))
    for dep in deps:
        args.append('--js')
        args.append(dep.GetPath())
    for input in config['inputs']:
        args.append('--js')
        args.append(input)

    subprocess.check_call(args)


def main(argv):
    option_parser = OptionParser()
    options, args = option_parser.parse_args(argv[1:])
    if args[0] == 'build':
        for arg in args[1:]:
            build(load_config(arg))
    else:
        raise RuntimeError()


if __name__ == '__main__':
    main(sys.argv)
