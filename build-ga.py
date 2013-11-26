#!/usr/bin/env python

from build import *

from pake import targets,TargetCollection, DuplicateTargetError

def prepend(name, data):
     f = open(name,'r')
     temp = f.read()
     f.close()
     ob = json.loads(temp) 
     open(name, "w").write(data + json.dumps(ob['layers'],sort_keys=True,indent=2))

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
        'build/ga-simple.js', 'build/ga-whitespace.js','build/layersconfig')

        
# Adding ga custom source directoy

from build import SRC
SRC.extend([path for path in ifind('src/ga')
       if path.endswith('.js')
       if path not in SHADER_SRC])

AVAILABLE_LANGS = ['de','fr','en','it','rm']

# Custom target for ga

@target('build/ga.css', 'build/ga.js')
def build_ga_css(t):
    t.touch()

@target('build/ga.js', PLOVR_JAR, SRC, EXTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga.json')
def build_ga_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ga.json')
    report_sizes(t)


@target('build/ga-simple.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga.json',
        'buildcfg/ol-simple.json')
def build_ga_simple_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ol-simple.json')
    report_sizes(t)

@target('build/ga-whitespace.js', PLOVR_JAR, SRC, INTERNAL_SRC, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga.json',
        'buildcfg/ga-whitespace.json')
def build_ga_whitespace_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR,
             'build', 'buildcfg/ga-whitespace.json')
    report_sizes(t)
    
@target('build/layersconfig', AVAILABLE_LANGS)
def get_layersconfig(t):
    for lang in AVAILABLE_LANGS:
        name = "%s.%s.js" % (t.name, lang)
        t.info('downloading %r', t.name)
        t.download('http://api3.geo.admin.ch/rest/services/api/MapServer/layersconfig?lang=%s' % lang)
        os.rename(t.name, name)
        t.info('downloaded %r', name)
        prepend(name, """var layerConfig = """)
        
   
  


if __name__ == '__main__':
    main()

