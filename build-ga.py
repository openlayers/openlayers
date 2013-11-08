#!/usr/bin/env python

from build import *


from pake import targets,TargetCollection, DuplicateTargetError


# Monkey patching build.py to allow redefining targets by 
def add(self, target, force=True):
        """add adds a concrete target to self, overriding it if the target
        already exists.  If target is the first target to be added, it becomes
        the default for this TargetCollection."""
        if target.name in self.targets and not force:
            raise DuplicateTargetError(target)
        self.targets[target.name] = target
        if self.default is None:
            self.default = target


from types import MethodType
targets.add = MethodType(add, targets, TargetCollection)

# We redefine 'build'
virtual('build', 'build/ga.css', 'build/ga.js',
        'build/ga-simple.js', 'build/ga-whitespace.js')

# Adding ga custom source directoy

from build import SRC
SRC.extend([path for path in ifind('src/ga')
       if path.endswith('.js')
       if path not in SHADER_SRC])

# Custom target for ga

@target('build/ga.css', 'build/ga.js')
def build_ga_css(t):
    t.touch()

@target('build/ga.js', PLOVR_JAR, SRC, EXTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ol.json')
def build_ga_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ol.json')
    report_sizes(t)


@target('build/ga-simple.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ol.json',
        'buildcfg/ol-simple.json')
def build_ga_simple_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ol-simple.json')
    report_sizes(t)

@target('build/ga-whitespace.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ol.json',
        'buildcfg/ga-whitespace.json')
def build_ga_whitespace_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR,
             'build', 'buildcfg/ga-whitespace.json')
    report_sizes(t)

if __name__ == '__main__':
    main()

