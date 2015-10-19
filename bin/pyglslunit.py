#!/usr/bin/python

from optparse import OptionParser
import json
import re
import sys



ESCAPE_SEQUENCE = {
        '\\': '\\\\',
        '\n': '\\n',
        '\t': '\\t'
        }


def js_escape(s):
    return ''.join(ESCAPE_SEQUENCE.get(c, c) for c in s)


def glsl_compress(s, shortNames):
    # strip leading whitespace
    s = re.sub(r'\A\s+', '', s)
    # strip trailing whitespace
    s = re.sub(r'\s+\Z', '', s)
    # strip multi-line comments
    s = re.sub(r'/\*.*?\*/', '', s)
    # strip single line comments
    s = re.sub(r'//.*?\n', '', s)
    # replace multiple whitespace with a single space
    s = re.sub(r'\s+', ' ', s)
    # remove whitespace between non-word tokens
    s = re.sub(r'(\S)\s+([^\w])', r'\1\2', s)
    s = re.sub(r'([^\w])\s+(\S)', r'\1\2', s)
    # replace original names with short names
    for originalName, shortName in shortNames.items():
        s = s.replace(originalName, shortName)
    return s


def main(argv):
    option_parser = OptionParser()
    option_parser.add_option('--input')
    option_parser.add_option('--output')
    options, args = option_parser.parse_args(argv[1:])

    context = {}
    nextShortName = ord('a')
    shortNames = {}

    common, vertex, fragment = [], [], []
    attributes, uniforms, varyings = {}, {}, {}
    block = None
    for line in open(options.input, 'rU'):
        if line.startswith('//!'):
            m = re.match(r'//!\s+NAMESPACE=(\S+)\s*\Z', line)
            if m:
                context['namespace'] = m.group(1)
                continue
            m = re.match(r'//!\s+CLASS=(\S+)\s*\Z', line)
            if m:
                context['className'] = m.group(1)
                continue
            m = re.match(r'//!\s+COMMON\s*\Z', line)
            if m:
                block = common
                continue
            m = re.match(r'//!\s+VERTEX\s*\Z', line)
            if m:
                block = vertex
                continue
            m = re.match(r'//!\s+FRAGMENT\s*\Z', line)
            if m:
                block = fragment
                continue
        else:
            if block is None:
                assert line.rstrip() == ''
            else:
                block.append(line)
            m = re.match(r'attribute\s+\S+\s+(\S+);\s*\Z', line)
            if m:
                attribute = m.group(1)
                if attribute not in attributes:
                    shortName = chr(nextShortName)
                    nextShortName += 1
                    attributes[attribute] = {'originalName': attribute, 'shortName': shortName}
                    shortNames[attribute] = shortName
            m = re.match(r'uniform\s+\S+\s+(\S+);\s*\Z', line)
            if m:
                uniform = m.group(1)
                if uniform not in uniforms:
                    shortName = chr(nextShortName)
                    nextShortName += 1
                    uniforms[uniform] = {'originalName': uniform, 'shortName': shortName}
                    shortNames[uniform] = shortName
            m = re.match(r'varying\s+\S+\s+(\S+);\s*\Z', line)
            if m:
                varying = m.group(1)
                if varying not in varyings:
                    shortName = chr(nextShortName)
                    nextShortName += 1
                    shortNames[varying] = shortName

    context['getOriginalFragmentSource'] = js_escape(''.join(common + fragment))
    context['getOriginalVertexSource'] = js_escape(''.join(common + vertex))
    context['getFragmentSource'] = glsl_compress(''.join(common + fragment), shortNames)
    context['getVertexSource'] = glsl_compress(''.join(common + vertex), shortNames)
    context['getAttributes'] = [attributes[a] for a in sorted(attributes.keys())]
    context['getUniforms'] = [uniforms[u] for u in sorted(uniforms.keys())]

    if options.output and options.output != '-':
        output = open(options.output, 'wb')
    else:
        output = sys.stdout
    json.dump(context, output)


if __name__ == '__main__':
    sys.exit(main(sys.argv))
