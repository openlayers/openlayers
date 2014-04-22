#!/usr/bin/env python

from operator import attrgetter
from optparse import OptionParser
import re
import sys


def simplerepr(obj):
    keys = sorted(key for key in obj.__dict__.keys() if not key.startswith('_'))
    attrs = ''.join(' %s=%r' % (key, obj.__dict__[key]) for key in keys)
    return '<%s%s>' % (obj.__class__.__name__, attrs)


class Exportable(object):

    def __init__(self, name):
        self.name = name

    __repr__ = simplerepr

    def export(self):
        return ''


class Symbol(Exportable):

    def __init__(self, name, export_symbol):
        Exportable.__init__(self, name)
        self.export_symbol = export_symbol
        self.props = set()

    __repr__ = simplerepr

    def export(self):
        lines = []
        if self.export_symbol:
            lines.append('\n\ngoog.exportSymbol(\n    \'%s\',\n    %s);\n' % (self.name, self.name))
        lines.extend('goog.exportProperty(\n    %s,\n    \'%s\',\n    %s.%s);\n' % (self.name, prop, self.name, prop) for prop in sorted(self.props))
        return ''.join(lines)


def main(argv):

    option_parser = OptionParser()
    option_parser.add_option('--exports', action='store_true')
    options, args = option_parser.parse_args(argv[1:])

    objects = {}
    requires = set()
    for arg in args:
        for line in open(arg, 'rU'):
            line = line.strip()
            if not line:
                continue
            m = re.match(r'@exportProperty\s+(?P<prop>\S+)\Z', line)
            if m:
                components = m.group('prop').split('.')
                if components[-2] == 'prototype':
                    requires.add('.'.join(components[:-2]))
                else:
                    requires.add('.'.join(components[:-1]))
                name = '.'.join(components[:-1]) 
                prop = components[-1]
                if name in objects:
                    symbol = objects[name]
                else:
                    symbol = Symbol(name, False)
                    objects[name] = symbol
                symbol.props.add(prop)
                continue
            m = re.match(r'@exportSymbol\s+(?P<name>\S+)\Z', line)
            if m:
                name = m.group('name')
                if name in objects:
                    raise RuntimeError(line)  # Name already defined
                symbol = Symbol(name, True)
                objects[name] = symbol
                components = m.group('name').split('.')
                if re.match(r'[A-Z]', components[-1]):
                    requires.add(name)
                else:
                    requires.add('.'.join(components[:-1]))
                continue
            raise RuntimeError(line)

    objects = sorted(objects.values(), key=attrgetter('name'))

    if options.exports:
        if requires:
            for require in sorted(requires):
                sys.stdout.write('goog.require(\'%s\');\n' % (require,))
        for obj in objects:
            sys.stdout.write(obj.export())

if __name__ == '__main__':
    sys.exit(main(sys.argv))
