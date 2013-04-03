#!/usr/bin/env python

import collections
import contextlib
import hashlib
import logging
import optparse
import os
import re
import shutil
import subprocess
import tempfile
import sys
import time
import urllib2


logger = logging.getLogger(__name__)


if hasattr(subprocess, 'check_output'):
    check_output = subprocess.check_output
else:
    # Copied with minor modifications from the Python source code
    # http://hg.python.org/cpython/file/9cb1366b251b/Lib/subprocess.py#l549
    def check_output(*popenargs, **kwargs):
        if 'stdout' in kwargs:
            raise ValueError(
                'stdout argument not allowed, it will be overridden.')
        process = subprocess.Popen(stdout=subprocess.PIPE,
                                   *popenargs, **kwargs)
        output, unused_err = process.communicate()
        retcode = process.poll()
        if retcode:
            cmd = kwargs.get("args")
            if cmd is None:
                cmd = popenargs[0]
            raise subprocess.CalledProcessError(retcode, cmd, output=output)
        return output


class PakeError(RuntimeError):
    pass


class AmbiguousRuleError(PakeError):

    def __init__(self, name):
        self.name = name

    def __str__(self):
        return '%r matches multiple rules' % (self.name,)


class BuildError(PakeError):

    def __init__(self, target, message):
        self.target = target
        self.message = message

    def __str__(self):
        return '%s: %s' % (self.target.name, self.message)


class DuplicateTargetError(PakeError):

    def __init__(self, target):
        self.target = target

    def __str__(self):
        return 'duplicate target %r' % (self.target.name,)


class Target(object):

    def __init__(self, name, action=None, clean=True, dependencies=(),
                 makedirs=True, phony=False, precious=False):
        self.name = name
        self.action = action
        self._clean = clean
        self.dependencies = list(flatten(dependencies))
        self._makedirs = makedirs
        self.phony = phony
        self.precious = precious
        self.logger = logging.getLogger(self.name)
        self.timestamp = None

    def build(self, dry_run=False):
        timestamp = 0
        for dependency in self.dependencies:
            target = targets.get(dependency)
            timestamp = max(timestamp, target.build(dry_run=dry_run))
        self.debug('build')
        if self.timestamp is None:
            if not self.phony and os.path.exists(self.name):
                self.timestamp = os.stat(self.name).st_mtime
            else:
                self.timestamp = -1
        if self.timestamp < timestamp:
            self.debug('action')
            if self._makedirs and not dry_run:
                self.makedirs(os.path.dirname(self.name))
            if self.action:
                if self.action.__doc__:
                    self.info(self.action.__doc__)
                if not dry_run:
                    self.action(self)
            self.timestamp = timestamp or time.time()
        return self.timestamp

    @contextlib.contextmanager
    def chdir(self, dir):
        cwd = os.getcwd()
        dir = dir % vars(variables)
        self.info('cd %s', dir)
        os.chdir(dir)
        try:
            yield dir
        finally:
            self.info('cd %s', cwd)
            os.chdir(cwd)

    def cp(self, *args):
        args = flatten_expand_list(args)
        dest = args.pop()
        for arg in args:
            self.info('cp %s %s', arg, dest)
            shutil.copy(arg, dest)

    def cp_r(self, *args):
        args = flatten_expand_list(args)
        dest = args.pop()
        for arg in args:
            self.info('cp -r %s %s', arg, dest)
            shutil.copytree(arg, dest)

    def clean(self, really=False, recurse=True):
        if (self._clean or really) and not self.precious:
            self.info('clean')
            try:
                os.remove(self.name)
            except OSError:
                pass
        if recurse:
            for dependency in self.dependencies:
                targets.get(dependency).clean(really=really, recurse=recurse)

    def debug(self, *args, **kwargs):
        self.logger.debug(*args, **kwargs)

    def download(self, url, md5=None, sha1=None):
        content = urllib2.urlopen(url).read()
        if md5 and hashlib.md5(content).hexdigest() != md5:
            raise BuildError(self, 'corrupt download')
        if sha1 and hashlib.sha1(content).hexdigest() != sha1:
            raise BuildError(self, 'corrupt download')
        with open(self.name, 'wb') as f:
            f.write(content)

    def error(self, message):
        raise BuildError(self, message)

    def graph(self, f, visited):
        if self in visited:
            return
        visited.add(self)
        for dependency in self.dependencies:
            target = targets.get(dependency)
            f.write('\t"%s" -> "%s";\n' % (self.name, target.name))
            target.graph(f, visited)

    def info(self, *args, **kwargs):
        self.logger.info(*args, **kwargs)

    def makedirs(self, path):
        path = path % vars(variables)
        if path and not os.path.exists(path):
            self.info('mkdir -p %s', path)
            os.makedirs(path)

    def newer(self, *args):
        args = flatten_expand_list(args)
        return [arg for arg in args
                if targets.get(arg).timestamp > self.timestamp]

    def output(self, *args, **kwargs):
        args = flatten_expand_list(args)
        self.info(' '.join(args))
        try:
            output = check_output(args, **kwargs)
            with open(self.name, 'w') as f:
                f.write(output)
        except subprocess.CalledProcessError as e:
            self.clean(recurse=False)
            self.error(e)

    def rm_rf(self, *args):
        args = flatten_expand_list(args)
        for arg in args:
            self.info('rm -rf %s', arg)
            shutil.rmtree(arg, ignore_errors=True)

    def run(self, *args, **kwargs):
        args = flatten_expand_list(args)
        self.info(' '.join(args))
        try:
            subprocess.check_call(args, **kwargs)
        except subprocess.CalledProcessError as e:
            self.clean(recurse=False)
            self.error(e)

    @contextlib.contextmanager
    def tempdir(self):
        tempdir = tempfile.mkdtemp()
        self.info('mkdir -p %s', tempdir)
        try:
            yield tempdir
        finally:
            self.info('rm -rf %s', tempdir)
            shutil.rmtree(tempdir, ignore_errors=True)

    def touch(self):
        if os.path.exists(self.name):
            os.utime(self.name, None)
        else:
            with open(self.name, 'w'):
                pass


class TargetCollection(object):

    def __init__(self):
        self.default = None
        self.targets = {}

    def add(self, target):
        if target.name in self.targets:
            raise DuplicateTargetError(target)
        self.targets[target.name] = target
        if self.default is None:
            self.default = target

    def get(self, name):
        if name in self.targets:
            return self.targets[name]
        target = None
        for regexp, f in rules.iteritems():
            match = regexp.search(name)
            if not match:
                continue
            if target is not None:
                raise AmbiguousRuleError(name)
            target = f(name, match)
        if target is None:
            target = Target(name, precious=True)
        self.targets[name] = target
        return target


class VariableCollection(object):

    def __init__(self, **kwargs):
        for key, value in kwargs.iteritems():
            setattr(self, key, value)

    def __setattr__(self, key, value):
        if not hasattr(self, key):
            object.__setattr__(self, key, value)


targets = TargetCollection()
rules = {}
variables = VariableCollection(**os.environ)


def flatten(*args):
    for arg in args:
        if (isinstance(arg, collections.Iterable) and
                not isinstance(arg, basestring)):
            for element in flatten(*arg):
                yield element
        else:
            yield arg


def flatten_expand_list(*args):
    return list(arg % vars(variables) for arg in flatten(args))


def ifind(*paths):
    for path in paths:
        for dirpath, dirnames, names in os.walk(path):
            for name in names:
                if sys.platform == 'win32':
                    yield '/'.join(dirpath.split('\\') + [name])
                else:
                    yield os.path.join(dirpath, name)


def main(argv=sys.argv):
    option_parser = optparse.OptionParser()
    option_parser.add_option('-c', '--clean',
                             action='store_true')
    option_parser.add_option('-g', '--graph',
                             action='store_true')
    option_parser.add_option('-n', '--dry-run', '--just-print', '--recon',
                             action='store_true')
    option_parser.add_option('-r', '--really',
                             action='store_true')
    option_parser.add_option('-v', '--verbose',
                             action='count', dest='logging_level')
    option_parser.set_defaults(logging_level=0)
    options, args = option_parser.parse_args(argv[1:])
    logging.basicConfig(format='%(asctime)s %(name)s: %(message)s',
                        level=logging.INFO - 10 * options.logging_level)
    targets_ = []
    for arg in args:
        match = re.match(r'(?P<key>\w+)=(?P<value>.*)\Z', arg)
        if match:
            key, value = match.group('key', 'value')
            if not hasattr(variables, key):
                logger.error('%s is not a variable', key)
            logger.debug('%s=%r', key, value)
            object.__setattr__(variables, key, value)
            continue
        targets_.append(arg)
    if not targets_:
        targets_ = (targets.default.name,)
    try:
        for target in targets_:
            target = targets.get(target)
            if options.clean:
                target.clean(really=options.really, recurse=True)
            elif options.graph:
                sys.stdout.write('digraph "%s" {\n' % (target.name,))
                target.graph(sys.stdout, set())
                sys.stdout.write('}\n')
            else:
                target.build(dry_run=options.dry_run)
    except BuildError as e:
        logger.error(e)
        sys.exit(1)


def output(*args):
    args = flatten_expand_list(args)
    logger.debug(' '.join(args))
    return check_output(args)


def rule(pattern):
    def f(targetmaker):
        rules[re.compile(pattern)] = targetmaker
    return f


def target(name, *dependencies, **kwargs):
    def f(action):
        target = Target(name, action=action, dependencies=dependencies,
                        **kwargs)
        targets.add(target)
    return f


def virtual(name, *dependencies, **kwargs):
    target = Target(name, dependencies=dependencies, clean=False, phony=True,
                    **kwargs)
    targets.add(target)


def which(program):
    """Returns the full path of a given argument or `None`.
    See: http://stackoverflow.com/questions/377017/test-if-executable-exists-in-python"""
    def is_exe(fpath):
        return os.path.isfile(fpath) and os.access(fpath, os.X_OK)
    fpath, fname = os.path.split(program)
    if fpath:
        if is_exe(program):
            return program
    else:
        for path in os.environ["PATH"].split(os.pathsep):
            path = path.strip('"')
            exe_file = os.path.join(path, program)
            if is_exe(exe_file):
                return exe_file
    return None
