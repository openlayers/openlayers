#!/usr/bin/env python

from build import *

from pake import targets,TargetCollection, DuplicateTargetError



def prepend(name, template):
     f = open(name,'r')
     temp = f.read()
     f.close()
     ob = json.loads(temp) 
     open(name, "w").write( template % json.dumps(ob,sort_keys=True,indent=2))

# We redefine 'build'
virtual('build', 'build/ol.css', 'build/ga.css', 'build/ga.js',
        'build/ga-debug.js','build/layersconfig', 'build/serverconfig', override=True)

# We redefine 'check' to use ga.js instead of ol.js
virtual('check', 'lint', 'build/ga.js', 'test', override=True)

@target('build/jsdoc-%(BRANCH)s-timestamp' % vars(variables), 'host-resources',
        SRC, SHADER_SRC, ifind('config/jsdoc/api/template'), override=True)
def jsdoc_BRANCH_timestamp(t):
    t.run('%(JSDOC)s', 'config/jsdoc/api/ga-index.md',
          '-c', 'config/jsdoc/api/ga-conf.json',
          '-d', 'build/hosted/%(BRANCH)s/apidoc')
    t.touch()


# Adding ga custom source directoy

from build import SRC
SRC.extend([path for path in ifind('src/ga')
       if path.endswith('.js')
       if path not in SHADER_SRC])

AVAILABLE_LANGS = ['de','fr','en','it','rm']

api_url = os.environ.get('API_URL', '//api3.geo.admin.ch')

@target('build/ga.css', 'css/ga.css')
def build_ga_css(t):
    t.output('%(CLEANCSS)s', 'css/ga.css')

@target('build/ga.js', SRC, SHADER_SRC, 'config/ga.json')
def build_ga_js(t):
    t.run('node', 'tasks/build.js', 'config/ga.json', 'build/ga.js')
    report_sizes(t)

@target('build/ga-debug.js', SRC, SHADER_SRC, 'config/ga-debug.json')
def build_ga_debug_js(t):
    t.run('node', 'tasks/build.js', 'config/ga-debug.json', 'build/ga-debug.js')
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

#Overwrite host examples target
@target('host-examples', 'build', 'host-resources', 'examples', phony=True, override=True)
def host_examples(t):
    examples_dir = 'build/hosted/%(BRANCH)s/examples'
    build_dir = 'build/hosted/%(BRANCH)s/build'
    css_dir = 'build/hosted/%(BRANCH)s/css'
    closure_lib_path = output('node', '-e',
        'process.stdout.write(require("closure-util").getLibraryPath())')
    t.rm_rf(examples_dir)
    t.makedirs(examples_dir)
    t.rm_rf(build_dir)
    t.makedirs(build_dir)
    t.rm_rf(css_dir)
    t.makedirs(css_dir)
    t.cp(EXAMPLES, examples_dir)
    for example in [path.replace('.html', '.js') for path in EXAMPLES]:
        split_example_file(example, examples_dir % vars(variables))
    t.cp_r('examples/data', examples_dir + '/data')
    t.cp('bin/loader_hosted_examples.js', examples_dir + '/loader.js')
    t.cp('build/ga.js', 'build/ga-debug.js', 'build/layersconfig.de.js',
         'build/layersconfig.en.js', 'build/layersconfig.fr.js', 'build/layersconfig.it.js',
         'build/layersconfig.rm.js', 'build/serverconfig.js', build_dir)
    t.cp('build/ga.js', build_dir + '/ol.js')
    t.cp('build/ga-debug.js', build_dir + '/ol-debug.js')
    t.cp('build/ol.css', css_dir)
    t.cp('build/ga.css', css_dir)
    t.cp('css/marker.png', css_dir)
    t.cp('css/editortoolbar.png', css_dir)
    t.cp('examples/index.html', 'examples/example-list.js',
         'examples/example-list.xml', 'examples/Jugl.js', examples_dir)
    t.rm_rf('build/hosted/%(BRANCH)s/closure-library')
    t.cp_r(closure_lib_path, 'build/hosted/%(BRANCH)s/closure-library')
    t.rm_rf('build/hosted/%(BRANCH)s/ol')
    t.makedirs('build/hosted/%(BRANCH)s/ol')
    t.cp_r('src/ol', 'build/hosted/%(BRANCH)s/ol/ol')
    t.run('%(PYTHON)s', closure_lib_path + '/closure/bin/build/depswriter.py',
          '--root_with_prefix', 'src ../../../ol',
          '--root', 'build/hosted/%(BRANCH)s/closure-library/closure/goog',
          '--root_with_prefix', 'build/hosted/%(BRANCH)s/closure-library/'
          'third_party ../../third_party',
          '--output_file', 'build/hosted/%(BRANCH)s/build/ol-deps.js')



#Overwrite build all examples because of externs
@target('build/examples/all.combined.js', 'build/examples/all.js',
        SRC, SHADER_SRC, 'config/ga-examples-all.json', override=True)
def build_examples_all_combined_js(t):
    t.run('node', 'tasks/build.js', 'config/examples-all.json',
          'build/examples/all.combined.js')
    report_sizes(t)



#Overwrite examples json rule because of externs
@rule(r'\Abuild/examples/(?P<id>.*).json\Z')
def examples_star_json(name, match):
    def action(t):
        # It would make more sense to use olx.js as an input file here. We use
        # it as an externs file instead to prevent "Cannot read property '*' of
        # undefined" error when running examples in "raw" or "whitespace" mode.
        # Note that we use the proper way in config/examples-all.json, which
        # is only used to check the examples code using the compiler.
        content = json.dumps({
          "exports": [],
          "src": ["src/**/*.js", "examples/%(id)s.js" % match.groupdict()],
          "compile": {
            "externs": [
              "externs/bingmaps.js",
              "externs/bootstrap.js",
              "externs/closure-compiler.js",
              "externs/example.js",
              "externs/geojson.js",
              "externs/jquery-1.7.js",
              "externs/oli.js",
              "externs/olx.js",
              "externs/proj4js.js",
              "externs/tilejson.js",
              "externs/topojson.js",
              "externs/vbarray.js",
              "externs/ga.js",
              "externs/gax.js"
            ],
            "define": [
              "goog.dom.ASSUME_STANDARDS_MODE=true",
              "goog.json.USE_NATIVE_JSON=true",
              "goog.DEBUG=false"
            ],
            "jscomp_error": [
              "accessControls",
              "ambiguousFunctionDecl",
              "checkDebuggerStatement",
              "checkEventfulObjectDisposal",
              "checkProvides",
              "checkRegExp",
              "checkStructDictInheritance",
              "checkTypes",
              "checkVars",
              "const",
              "constantProperty",
              "deprecated",
              "duplicate",
              "duplicateMessage",
              "es3",
              "es5Strict",
              "externsValidation",
              "fileoverviewTags",
              "globalThis",
              "internetExplorerChecks",
              "invalidCasts",
              "misplacedTypeAnnotation",
              "missingProperties",
              "nonStandardJsDocs",
              "strictModuleDepCheck",
              "suspiciousCode",
              "typeInvalidation",
              "tweakValidation",
              "undefinedNames",
              "undefinedVars",
              "unknownDefines",
              "uselessCode",
              "violatedModuleDep",
              "visibility"
            ],
            "extra_annotation_name": [
              "api", "observable"
            ],
            "compilation_level": "ADVANCED",
            "output_wrapper": "// OpenLayers 3. See http://ol3.js.org/\n(function(){%output%})();",
            "use_types_for_optimization": True,
            "manage_closure_dependencies": True
          }
        })
        with open(t.name, 'wb') as f:
            f.write(content)
    return Target(name, action=action, dependencies=[__file__])



        
if __name__ == '__main__':
    main()

