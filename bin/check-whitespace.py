import logging
import re
import sys

logging.basicConfig(format='%(asctime)s %(name)s: %(message)s',
                    level=logging.INFO)

logger = logging.getLogger('check-whitespace')

CR_RE = re.compile(r'\r')
LEADING_WHITESPACE_RE = re.compile(r'\s+')
TRAILING_WHITESPACE_RE = re.compile(r'\s+\n\Z')
NO_NEWLINE_RE = re.compile(r'[^\n]\Z')
ALL_WHITESPACE_RE = re.compile(r'\s+\Z')


def check_whitespace(*filenames):
    errors = 0
    for filename in sorted(filenames):
        whitespace = False
        for lineno, line in enumerate(open(filename, 'rU')):
            if lineno == 0 and LEADING_WHITESPACE_RE.match(line):
                logger.info('%s:%d: leading whitespace', filename, lineno + 1)
                errors += 1
            if CR_RE.search(line):
                logger.info('%s:%d: carriage return character in line',
                            filename, lineno + 1)
                errors += 1
            if TRAILING_WHITESPACE_RE.search(line):
                logger.info('%s:%d: trailing whitespace', filename, lineno + 1)
                errors += 1
            if NO_NEWLINE_RE.search(line):
                logger.info('%s:%d: no newline at end of file', filename,
                            lineno + 1)
                errors += 1
            whitespace = ALL_WHITESPACE_RE.match(line)
        if whitespace:
            logger.info('%s: trailing whitespace at end of file', filename)
            errors += 1
    return errors

if __name__ == "__main__":
    errors = check_whitespace(*sys.argv[1:])
    if errors > 0:
        logger.error('%d whitespace errors' % (errors,))
        sys.exit(1)
