const Compiler = require('google-closure-compiler').compiler;

const compiler = new Compiler({
  js: [
    './build/src-closure/**.js',
    './node_modules/pbf/package.json', './node_modules/pbf/**.js', './node_modules/ieee754/**.js',
    './node_modules/pixelworks/package.json', './node_modules/pixelworks/**.js',
    './node_modules/rbush/package.json', './node_modules/rbush/**.js', 'node_modules/quickselect/**.js'
  ],
  entry_point: './build/src-closure/index.js',
  module_resolution: 'NODE',
  dependency_mode: 'STRICT',
  process_common_js_modules: true,
  checks_only: true,
  //FIXME Change newCheckTypes to jscomp_error when we have path types everywhere
  jscomp_warning: ['newCheckTypes'],
  // Options to make dependencies work
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
