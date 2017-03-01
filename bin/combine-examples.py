#!/usr/bin/python

import re
import sys


def main(argv):
    examples = {}
    requires = set()
    for filename in argv[1:]:
        lines = open(filename, 'rU').readlines()
        if len(lines) > 0 and lines[0].startswith('// NOCOMPILE'):
            continue
        requires.update(line for line in lines if line.startswith('goog.require'))
        examples[filename] = [line for line in lines if not line.startswith('goog.require')]
    for require in sorted(requires):
        sys.stdout.write(require)
    for filename in sorted(examples.keys()):
        sys.stdout.write('// ' + filename + '\n')
        sys.stdout.write('(function(){\n')
        for line in examples[filename]:
            sys.stdout.write(line)
        sys.stdout.write('})();\n')


if __name__ == '__main__':
    sys.exit(main(sys.argv))
