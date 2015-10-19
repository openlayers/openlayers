import os
import logging
import re
import sys

logging.basicConfig(format='%(asctime)s %(name)s: %(message)s',
                    level=logging.INFO)

logger = logging.getLogger('check-requires')


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


def check_requires(closure_lib, *filenames):
    unused_count = 0
    all_provides = set()

    for filename in ifind(closure_lib):
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

    for filename in sorted(filenames):
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
            logger.info('%s:%d: unused goog.require: %r' % (
                filename, require_linenos[require], require))
            unused_count += 1

    all_provides.discard('ol')
    all_provides.discard('ol.MapProperty')

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
    for filename in sorted(filenames):
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
                logger.info("%s:%d missing goog.require('%s')" %
                            (filename, uses_linenos[missing_require],
                             missing_require))
                missing_count += 1

    return (unused_count, missing_count)


if __name__ == "__main__":
    unused_count, missing_count = check_requires(*sys.argv[1:])
    if unused_count > 0 or missing_count > 0:
        logger.error('%d unused goog.requires, %d missing goog.requires' %
                     (unused_count, missing_count))
        sys.exit(1)
