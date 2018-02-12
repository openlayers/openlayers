const fs = require('fs');
const util = require('util');
const path = require('path');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const externs = path.resolve(__dirname, '../externs');

function parse(source) {
  const length = source.length;

  let index = 0;
  const IN_CODE = 'in code';
  const IN_COMMENT = 'in comment';

  function next() {
    const char = source.charAt(index);
    ++index;
    return char;
  }

  function scanLine() {
    let char = next();
    let line = '';
    while (index < length && char !== '\n') {
      line += char;
      char = next();
    }
    return line;
  }

  let state = IN_CODE;
  const blocks = [];
  let comment;
  while (index < length) {
    const line = scanLine();
    if (state === IN_CODE) {
      if (line === '/**') {
        state = IN_COMMENT;
        comment = '';
      }
      continue;
    }

    // in a comment
    if (!line) {
      continue;
    }

    if (line !== ' */') {
      comment += line + '\n';
      continue;
    }

    // comment is done
    const code = scanLine();
    if (code.startsWith('olx')) {
      blocks.push({code, comment});
    }
    state = IN_CODE;
  }
  return blocks;
}

function processParam(name, comment) {
  const IN_DESCRIPTION = 'in description';
  const IN_TYPE = 'in type';
  const DONE = 'done';

  const lines = comment.split('\n');
  lines.pop(); // ends with newline
  let description = '';
  let type;
  let state = IN_DESCRIPTION;
  lines.forEach(line => {
    if (state === DONE) {
      throw new Error(`Extra comment after @api for param ${name}:\n${comment}`);
    }

    if (!(line.startsWith(' * ') || line === ' *')) {
      throw new Error(`Unexpected comment start for param ${name}:\n${comment}`);
    }

    if (line.indexOf('@type ') === 3) {
      state = IN_TYPE;
      if (type) {
        throw new Error(`Duplicate type for param ${name}:\n${comment}`);
      }
      type = line.slice(9);
      return;
    }

    if (line.indexOf('@api') === 3) {
      state = DONE;
      return;
    }

    if (state === IN_DESCRIPTION) {
      if (type) {
        throw new Error(`Description after type for param ${name}:\n${comment}`);
      }
      description += line.slice(3) + '\n';
      return;
    }

    type += line.slice(3) + '\n';
  });

  return {name, type, description};
}

function getName(name) {
  if (!name.startsWith('olx.')) {
    throw new Error(`Unexpected name: ${name}`);
  }
  return name.slice(4).replace(/\./g, '_');
}

function processBlock(block, data) {
  const name = getName(block.code.slice(0, -1));

  const protoStart = name.indexOf('_prototype_');
  if (protoStart > 0) {
    const parentName = name.slice(0, protoStart);
    const childName = name.slice(protoStart + 11);
    if (!(parentName in data)) {
      throw new Error(`No parent for ${block.code}`);
    }
    const param = processParam(childName, block.comment);
    data[parentName].params.push(param);
    return;
  }

  if (block.comment.indexOf('@typedef') === -1) {
    if (block.comment.indexOf('Namespace.') === -1) {
      throw new Error(`Unexpected comment for ${block.code}`);
    }
    return;
  }

  data[name] = {
    name,
    comment: block.comment,
    params: []
  };
}

function processBlocks(blocks) {
  const data = {};
  blocks.forEach(block => processBlock(block, data));
  return data;
}

function format(data) {
  let source = '';
  for (const name in data) {
    const comment = data[name].comment;

    // add the @typedef
    source += `\n/**\n${comment} */\n`;
    source += `export let ${name};\n\n`;

    const params = data[name].params;
    if (!params.length) {
      throw new Error(`No params for ${name}`);
    }

    source += '/**\n';
    source += ` * @param {${name}} options TODO: repace this\n *\n`;
    params.forEach(param => {
      const description = param.description.split('\n').join('\n * ');
      source += ` * @param ${param.type} options.${param.name} ${description}\n`;
    });
    source += ' */\n\n';
  }
  return source;
}

async function main() {
  const source = String(await readFile(path.join(externs, 'olx.js')));
  const blocks = parse(source);
  const data = processBlocks(blocks);
  const output = format(data);
  await writeFile(path.join(externs, 'xol.js'), output);
}

if (require.main === module) {
  main().catch(err => {
    process.stdout.write(`${err.stack}\n`, () => process.exit(1));
  });
}
