const Compiler = require('google-closure-compiler').compiler;

const compiler = new Compiler({
  js: [
    './src/**.js',
    './node_modules/pbf/package.json', './node_modules/pbf/**.js', './node_modules/ieee754/**.js',
    './node_modules/pixelworks/package.json', './node_modules/pixelworks/**.js',
    './node_modules/rbush/package.json', './node_modules/rbush/**.js', 'node_modules/quickselect/**.js'
  ],
  entry_point: './src/index.js',
  module_resolution: 'NODE',
  //FIXME Use compilation_level: 'ADVANCED' after we have switched to path types
  compilation_level: 'SIMPLE',
  new_type_inf: true,
  generate_exports: true,
  export_local_property_definitions: true,
  output_wrapper: '(function(){%output%})() //# sourceMappingURL=ol.js.map',
  js_output_file: 'build/ol.js',
  create_source_map: '%outname%.map',
  source_map_include_content: true,
  //FIXME Turn jscomp_error on for * when we have path types everywhere
  //FIXME Change newCheckTypes to jscomp_error when we have path types everywhere
  jscomp_warning: ['newCheckTypes'],
  // Options to make dependencies work
  process_common_js_modules: true,
  dependency_mode: 'STRICT',
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
