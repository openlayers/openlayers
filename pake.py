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


class UnknownTargetError(PakeError):

    def __init__(self, name):
        self.name = name

    def __str__(self):
        return 'unknown target %r' % (self.name,)


class Target(object):
    """Target is the core object of pake.  It includes all of the target's name
    (which may or may not correspond to a real file in the filesystem, see the
    comments in virtual and TargetCollection below), the action to be performed
    when this target is to be rebuilt, its dependencies, and various other
    metadata."""

    def __init__(self, name, action=None, clean=True, dependencies=(),
                 help=None, help_group=None, makedirs=True, phony=False,
                 precious=False):
        self.name = name
        self.action = action
        self._clean = clean
        self.dependencies = list(flatten(dependencies))
        self.help = help
        self.help_group = help_group
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
        """output runs the command passed to it, saving the output of the
        command to the contents of the target.  For example:
            @target('ofile')
            def ofile(t):
                t.output('echo', '123')
        After this target's action is executed, ofile will contain the string
        "123"."""
        args = flatten_expand_list(args)
        self.info(' '.join(args))
        try:
            output = check_output(args, **kwargs)
            with open(self.name, 'wb') as f:
                f.write(output)
        except subprocess.CalledProcessError as e:
            self.clean(recurse=False)
            self.error(e)

    def rm_rf(self, *args):
        """rm_rf recursively deletes the files and/or directories passed to
        it."""
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
        """tempdir creates a temporary directory, changes to it, and runs the
        nested block of code.  However the nested block of code exits, tempdir
        will delete the temporary directory permanently, before pake exits. For
        example:
            with t.tempdir():
                # copy various files to $PWD (the temporary directory)
                # zip up the contents of $PWD, or copy them somewhere else
        However the above code exits (e.g. copy error or zip error), the
        temporary directory will be cleaned up."""
        tempdir = tempfile.mkdtemp()
        self.info('mkdir -p %s', tempdir)
        try:
            yield tempdir
        finally:
            self.info('rm -rf %s', tempdir)
            shutil.rmtree(tempdir, ignore_errors=True)

    def touch(self):
        """touch updates the timestamp of the target.  If the target already
        exists as a file in the filesystem its timestamp is updated, otherwise
        a new file is created with the current timestamp."""
        if os.path.exists(self.name):
            os.utime(self.name, None)
        else:
            with open(self.name, 'wb'):
                pass


class TargetCollection(object):
    """TargetCollection implements a namespace for looking up build targets.
    TargetCollection will first look for rules that match exactly, and then
    - if no match is found - search through a list of regular expression-based
    rules.  As soon as a regular expression match is found, that rule is added
    to the list of rules that match exactly.  Typically, an invocation of pake
    will only create a single TargetCollection."""

    def __init__(self):
        self.default = None
        self.targets = {}

    def add(self, target):
        """add adds a concrete target to self, raising an error if the target
        already exists.  If target is the first target to be added, it becomes
        the default for this TargetCollection."""
        if target.name in self.targets:
            raise DuplicateTargetError(target)
        self.targets[target.name] = target
        if self.default is None:
            self.default = target

    def get(self, name):
        """get searches for a target.  If it already exists, it is returned.
        Otherwise, get searches through the defined rules, trying to find a
        rule that matches.  If it finds a matching rule, a concrete target is
        instantiated, cached, and returned.  If no match is found, a virtual
        precious target is instantiated and returned."""
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
            if os.path.exists(name):
                target = Target(name, precious=True)
            else:
                raise UnknownTargetError(name)
        self.targets[name] = target
        return target

    def format_epilog(self, formatter):
        helps_by_help_group = collections.defaultdict(dict)
        max_name_len = 0
        for name in sorted(self.targets):
            target = self.targets[name]
            if target.help is not None:
                helps_by_help_group[target.help_group][name] = target.help
                max_name_len = max(max_name_len, len(name))
        lines = []
        lines.append('Targets:\n')
        format = '  %%-%ds  %%s\n' % (max_name_len,)
        for help_group in sorted(helps_by_help_group.keys()):
            helps = helps_by_help_group[help_group]
            if help_group is not None:
                lines.append('%s targets:\n' % (help_group,))
            for name in sorted(helps.keys()):
                lines.append(format % (name, helps[name]))
        return ''.join(lines)


class VariableCollection(object):
    """VariableCollection implements an object with properties where the first
    set of a property wins, and all further sets are ignored. For example:
        vc = VariableCollection()
        vc.FOO = 1    # First set of the property FOO
        vc.FOO = 2    # Further sets of the property FOO are ignored, and do
                      # not raise an error.  After this statement, vc.FOO is
                      # still 1.
        print vc.FOO  # Prints "1" """

    def __init__(self, **kwargs):
        for key, value in kwargs.iteritems():
            setattr(self, key, value)

    def __setattr__(self, key, value):
        """Only set an attribute if it has not already been set.  First to set
        the value is the winner."""
        if not hasattr(self, key):
            object.__setattr__(self, key, value)


# targets is the single TargetCollection instance created for this invokation
# of pake
targets = TargetCollection()
# rules is a dict of regular expressions to @rules where dynamically created
# rules are registered.
rules = {}
# variables is the global set of substitution variables, where the first setter
# takes priority.  The priority order is:
# 1. Environment variables
# 2. Command line arguments
# 3. Internal Python settings in build.py
variables = VariableCollection(**os.environ)


def flatten(*args):
    """flatten takes a variable number of arguments, each of which may or may
    be not be a collection.Iterable, and yields the elements of each in
    depth-first order.  In short, it flattens nested iterables into a single
    collection.  For example, flatten(1, [2, (3, 4), 5], 6) yields 1, 2, 3, 4,
    5, 6."""
    for arg in args:
        if (isinstance(arg, collections.Iterable) and
                not isinstance(arg, basestring)):
            for element in flatten(*arg):
                yield element
        else:
            yield arg


def flatten_expand_list(*args):
    """flatten_expand_list applies flatten, treats each element as a string,
    and formats each string according to the global value of variables."""
    return list(arg % vars(variables) for arg in flatten(args))


def ifind(*paths):
    """ifind is an iterative version of os.walk, yielding all walked paths and
    normalizing paths to use forward slashes."""
    for path in paths:
        for dirpath, dirnames, names in os.walk(path):
            for name in names:
                if os.sep == '/':
                    yield os.path.join(dirpath, name)
                else:
                    yield '/'.join(dirpath.split(os.sep) + [name])


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
    option_parser.format_epilog = targets.format_epilog
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
    """output captures the output of a single command.  It is typically used to
    set variables that only need to be set once.  For example:
        UNAME_A = output('uname', '-a')
    If you need to capture the output of a command in a target, you should use
    t.output."""
    args = flatten_expand_list(args)
    logger.debug(' '.join(args))
    return check_output(args)


def rule(pattern):
    def f(targetmaker):
        rules[re.compile(pattern)] = targetmaker
    return f


def target(name, *dependencies, **kwargs):
    """The @target decorator describes the action needed to build a single
    target file when its dependencies are out of date.  For example:
        @target('hello', 'hello.c')
        def hello(t):
            t.run('gcc', '-o', t.name, t.dependencies)
            # the above line will run gcc -o hello hello.c
    See the documentation for Target to see the properties provide by the
    target t."""
    def f(action):
        target = Target(name, action=action, dependencies=dependencies,
                        **kwargs)
        targets.add(target)
    return f


def virtual(name, *dependencies, **kwargs):
    """virtual targets are metatargets.  They do not correspond to any real
    file in the filesystem, even if a file with the same name already exists.
    Virtual targets can be thought of as only existing for the duration of the
    build.   Their up-to-dateness or otherwise is independent of any existence
    or up-to-dateness of any actual file in the filesystem.  Typically they are
    used to group actions such as "all", "build", or "test"."""
    target = Target(name, dependencies=dependencies, clean=False, phony=True,
                    **kwargs)
    targets.add(target)


def which(program):
    """Returns the full path of a given argument or `None`.
    See:
    http://stackoverflow.com/questions/377017/test-if-executable-exists-in-python"""
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
