const fs = require('fs');

const ESCAPE_SEQUENCE = {
  '\\': '\\\\',
  '\n': '\\n',
  '\t': '\\t'
};

function js_escape(s) {
  return s.split('').map(function(c) {
    return ESCAPE_SEQUENCE[c] || c;
  }).join('');
}

function glsl_compress(s, shortNames) {
  // strip leading whitespace
  s = s.replace(/^\s+/g, '');
  // strip trailing whitespace
  s = s.replace(/\s+$/g, '');
  // strip multi-line comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  // strip single line comments
  s = s.replace(/\/\/.*?\n/, '');
  // replace multiple whitespace with a single space
  s = s.replace(/\s+/g, ' ');
  // remove whitespace between non-word tokens
  s = s.replace(/(\S)\s+([^\w])/g, '$1$2')
      .replace(/([^\w])\s+(\S)/g, '$1$2');
  // replace original names with short names
  for (var originalName in shortNames) {
    s = s.replace(new RegExp(originalName, 'gm'), shortNames[originalName]);
  }
  return s;
}

function main(argv) {
  var options = {};
  for (var i = 2, ii = argv.length; i < ii; i += 2) {
    options[argv[i].replace(/^../, '')] = argv[i + 1];
  }
  if (!options.input) {
    process.stdout.write('--input option missing\n');
    return 1;
  }

  const json = {};
  let nextShortName = 'a'.charCodeAt(0);
  const shortNames = {};

  const attributes = {};
  const uniforms = {};
  const varyings = {};
  const blocks = {
    common: '',
    vertex: '',
    fragment: ''
  };
  let block = undefined;
  const inFile = fs.readFileSync(options.input, 'utf-8');
  const lines = inFile.split('\n');

  let m, shortName;
  lines.forEach(function(line, i) {
    if (line.indexOf('//!') == 0) {
      m = line.match(/\/\/!\s+NAMESPACE=(\S+)\s*$/);
      if (m) {
        json.namespace = m[1];
        return;
      }
      m = line.match(/\/\/!\s+COMMON\s*$/);
      if (m) {
        block = 'common';
        return;
      }
      m = line.match(/\/\/!\s+VERTEX\s*$/);
      if (m) {
        block = 'vertex';
        return;
      }
      m = line.match(/\/\/!\s+FRAGMENT\s*$/);
      if (m) {
        block = 'fragment';
        return;
      }
    } else {
      if (block === undefined) {
        if (line.replace(/\s+$/g, '') != '') {
          process.stdout.write(`Error parsing ${options.input}\n`);
          return;
        }
      } else {
        blocks[block] += line + (i == lines.length - 1 ? '' : '\n');
      }
      m = line.match(/attribute\s+\S+\s+(\S+);\s*$/);
      if (m) {
        const attribute = m[1];
        if (!(attribute in attributes)) {
          shortName = String.fromCharCode(nextShortName++);
          attributes[attribute] = {
            originalName: attribute,
            shortName: shortName
          };
          shortNames[attribute] = shortName;
        }
      }
      m = line.match(/uniform\s+\S+\s+(\S+);\s*$/);
      if (m) {
        const uniform = m[1];
        if (!(uniform in uniforms)) {
          shortName = String.fromCharCode(nextShortName++);
          uniforms[uniform] = {
            originalName: uniform,
            shortName: shortName
          };
          shortNames[uniform] = shortName;
        }
      }
      m = line.match(/varying\s+\S+\s+(\S+);\s*$/);
      if (m) {
        const varying = m[1];
        if (!(varying in varyings)) {
          shortName = String.fromCharCode(nextShortName++);
          shortNames[varying] = shortName;
        }
      }
    }
  });

  json.originalFragmentSource = js_escape(blocks.common + blocks.fragment);
  json.originalVertexSource = js_escape(blocks.common + blocks.vertex);
  json.fragmentSource = glsl_compress(blocks.common + blocks.fragment, shortNames);
  json.vertexSource = glsl_compress(blocks.common + blocks.vertex, shortNames);
  json.attributes = Object.keys(attributes).map(a => attributes[a]);
  json.uniforms = Object.keys(uniforms).map(u => uniforms[u]);

  if (options.output && options.output != '-') {
    fs.writeFileSync(options.output, JSON.stringify(json));
  } else {
    process.stdout.write(JSON.stringify(json));
  }
  return 0;
}

if (require.main === module) {
  process.exit(main(process.argv));
}
