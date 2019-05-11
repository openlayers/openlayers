import {object} from 'prop-types';
import React from 'react';
import Markdown from 'react-markdown';
import Code from './Code';

function Func({func, module}) {
  const exportedName = module.getExportedName(func.name);
  let importCode;
  if (exportedName === 'default') {
    importCode = `import ${func.name} from '${module.id}';`;
  } else {
    importCode = `import {${exportedName}} from '${module.id}';`;
  }

  return (
    <div>
      <h3>{func.name}</h3>
      <Code value={importCode} />
      <Markdown source={func.doc.description} renderers={{code: Code}} />
    </div>
  );
}

Func.propTypes = {
  func: object.isRequired,
  module: object.isRequired
};

export default Func;
