const Compiler = require('google-closure-compiler').compiler;

const compiler = new Compiler({
  js: [
    './build/src-closure/**.js',
    // Resolve dependencies
    './node_modules/pbf/package.json', './node_modules/pbf/**.js', './node_modules/ieee754/**.js',
    './node_modules/pixelworks/package.json', './node_modules/pixelworks/**.js',
    './node_modules/rbush/package.json', './node_modules/rbush/**.js', 'node_modules/quickselect/**.js'
  ],
  externs: [
    './externs/bingmaps.js',
    './externs/cartodb.js',
    './externs/closure-compiler.js',
    './externs/esrijson.js',
    './externs/geojson.js',
    './externs/proj4js.js',
    './externs/tilejson.js',
    './externs/topojson.js'
  ],
  entry_point: './build/src-closure/index.js',
  module_resolution: 'NODE',
  dependency_mode: 'STRICT',
  checks_only: true,
  jscomp_error: ['*'],
  jscomp_off: [
    'lintChecks',
    'analyzerChecks'
  ],
  compilation_level: 'ADVANCED',
  extra_annotation_name: [
    'api', 'observable'
  ],
  // Options to make dependencies work
  process_common_js_modules: true,
  hide_warnings_for: 'node_modules'
});

compiler.run((exit, out, err) => {
  if (exit) {
    process.stderr.write(err, () => process.exit(exit));
  } else {
    process.stderr.write(err);
    process.stdout.write(out);
  }
});
