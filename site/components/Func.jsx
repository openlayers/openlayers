import {object} from 'prop-types';
import React from 'react';
import Markdown from 'react-markdown';
import Code from './Code';
import Parameter from './Parameter';

function Func({func, module, helper}) {
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
      <h6>Parameters</h6>
      <ul>
        {func.doc.params && func.doc.params.map(param => <Parameter param={param} module={module} helper={helper} />)}
      </ul>
    </div>
  );
}

Func.propTypes = {
  func: object.isRequired,
  module: object.isRequired,
  helper: object.isRequired
};

export default Func;
