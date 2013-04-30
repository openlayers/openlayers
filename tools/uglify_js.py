"""Utility to use the Uglify JS Compiler CLI from Python."""

import logging
import subprocess


def check_available():
    """ Returns whether the uglify-js tool is available. """
    subprocess.check_output(['which', 'uglifyjs'])


def compile(source_paths, flags=None):
    """
    Prepares command-line call to uglify-js compiler.

    Args:
      source_paths: Source paths to build, in order.
      flags: A list of additional flags to pass on to uglify-js.

    Returns:
      The compiled source, as a string, or None if compilation failed.
    """

    args = ['uglifyjs']
    args.extend(source_paths)
    args.extend(['-c', '-m'])
    if flags:
        args += flags

    logging.info('Compiling with the following command: %s', ' '.join(args))

    try:
        return subprocess.check_output(args)
    except subprocess.CalledProcessError:
        return
