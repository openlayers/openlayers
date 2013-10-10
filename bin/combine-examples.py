#!/usr/bin/python

import re
import sys


def main(argv):
    examples = {}
    requires = set()
    for filename in argv[1:]:
        lines = open(filename).readlines()
        if len(lines) > 0 and lines[0].startswith('// NOCOMPILE'):
            continue
        requires.update(line for line in lines if line.startswith('goog.require'))
        examples[filename] = [line for line in lines if not line.startswith('goog.require')]
    for require in sorted(requires):
        print require,
    for filename in sorted(examples.keys()):
        print '// ', filename
        print '(function(){'
        for line in examples[filename]:
            print line,
        print '})();'


if __name__ == '__main__':
    sys.exit(main(sys.argv))
