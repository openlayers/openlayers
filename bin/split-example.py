import os
import re
import sys


def split_example_file(example, dst_dir):
    lines = open(example, 'rU').readlines()

    target_lines = []
    target_require_lines = []

    found_requires = False
    found_code = False
    for line in lines:
        m = re.match(r'goog.require\(\'(.*)\'\);', line)
        if m:
            found_requires = True
            target_require_lines.append(line)
        elif found_requires:
            if found_code or line not in ('\n', '\r\n'):
                found_code = True
                target_lines.append(line)

    target = open(
        os.path.join(dst_dir, os.path.basename(example)), 'wb')
    target_require = open(
        os.path.join(dst_dir, os.path.basename(example)
          .replace('.js', '-require.js')),
        'wb')

    target.writelines(target_lines)
    target.close()

    target_require.writelines(target_require_lines)
    target_require.close()


if __name__ == '__main__':
    split_example_file(*sys.argv[1:])
