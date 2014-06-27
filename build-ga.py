#!/usr/bin/env python

from build import *

from pake import targets,TargetCollection, DuplicateTargetError



def prepend(name, template):
     f = open(name,'r')
     temp = f.read()
     f.close()
     ob = json.loads(temp) 
     open(name, "w").write( template % json.dumps(ob,sort_keys=True,indent=2))

def _build_require_list(dependencies, output_file_name):
    requires = set()
    for dependency in dependencies:
        for line in open(dependency):
            match = re.match(r'goog\.provide\(\'(.*)\'\);', line)
            if match:
                requires.add(match.group(1))
    with open(output_file_name, 'w') as f:
        for require in sorted(requires):
            f.write('goog.require(\'%s\');\n' % (require,))

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
        'build/ga-whitespace.js','build/layersconfig', 'build/serverconfig')

# We redefine 'check' to add definitons from externs/ga.js
virtual('check', 'lint', 'jshint', 'build/ga-all.js', 'test')

@target('build/ga-all.js', PLOVR_JAR, SRC, EXPORTS, SHADER_SRC, LIBTESS_JS_SRC,
        'buildcfg/base.json', 'buildcfg/ga-all.json')
def build_ol_all_js(t):
    t.output('%(JAVA)s', '-server', '-XX:+TieredCompilation', '-jar',
            PLOVR_JAR, 'build', 'buildcfg/ga-all.json')


# We redifine 'apidoc'
JSDOC = 'node_modules/.bin/jsdoc'

virtual('apidoc', 'node_modules/.bin/jsdoc' ,'build/jsdoc-%(BRANCH)s-timestamp' % vars(variables))

@target('node_modules/.bin/jsdoc')
def jsdoc_npm(t):
    t.run('npm', 'install', 'jsdoc@<=3.2.2')
    t.touch()

@target('build/jsdoc-%(BRANCH)s-timestamp' % vars(variables), 'host-resources',
        EXPORTS, SRC, SHADER_SRC,
        ifind('apidoc/template'))
def jsdoc_BRANCH_timestamp(t):
    t.run('%(JSDOC)s', 'apidoc/ga-index.md', '-c', 'apidoc/ga-conf.json',
          '-d', 'build/hosted/%(BRANCH)s/apidoc')
    t.touch()


# Adding ga custom source directoy

from build import SRC
SRC.extend([path for path in ifind('src/ga')
       if path.endswith('.js')
       if path not in SHADER_SRC])

AVAILABLE_LANGS = ['de','fr','en','it','rm']

api_url = os.environ.get('API_URL', '//api3.geo.admin.ch')

@target('build/ga.css', 'build/ga.js')
def build_ga_css(t):
    t.cp('css/ch_cross.png','build')
    t.cp('css/editortoolbar.png','build')
    t.touch()

@target('build/ga.js', PLOVR_JAR, SRC, EXPORTS, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga.json')
def build_ga_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR, 'build', 'buildcfg/ga.json')
    t.cp('resources/EPSG21781.js','build')
    t.cp('resources/EPSG2056.js','build')
    t.cp('resources/proj4js-compressed.js','build')
    report_sizes(t)

@target('build/ga-whitespace.js', PLOVR_JAR, SRC, EXPORTS, SHADER_SRC,
        LIBTESS_JS_SRC, 'buildcfg/base.json', 'buildcfg/ga.json',
        'buildcfg/ga-whitespace.json')
def build_ga_whitespace_js(t):
    t.output('%(JAVA)s', '-jar', PLOVR_JAR,
             'build', 'buildcfg/ga-whitespace.json')
    report_sizes(t)
    
@target('build/layersconfig')
def get_layersconfig(t):
    for lang in AVAILABLE_LANGS:
        name = "%s.%s.js" % (t.name, lang)
        t.info('downloading %r', t.name)
        t.download('http:' + api_url + '/rest/services/api/MapServer/layersConfig?lang=%s' % lang)
        os.rename(t.name, name)
        t.info('downloaded %r', name)
        prepend(name, """var GeoAdmin=GeoAdmin || {}; GeoAdmin.getConfig=function(){ return %s } """)

@target('build/serverconfig')
def serverconfig(t):
    with open(t.name + '.js', 'w') as f:
        f.write( """var GeoAdmin=GeoAdmin || {}; GeoAdmin.serviceUrl='"""+ api_url   + """'; """)
        
@target('serve', PLOVR_JAR, 'test-deps', 'examples')
def serve(t):
    t.run('%(JAVA)s', '-jar', PLOVR_JAR, 'serve', 'buildcfg/ol.json',
          'buildcfg/ga-all.json', EXAMPLES_JSON, 'buildcfg/test.json')

if __name__ == '__main__':
    main()

