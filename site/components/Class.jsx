import {object} from 'prop-types';
import React from 'react';
import Markdown from 'react-markdown';
import Code from './Code';
import Parameter from './Parameter';

function Class({cls, module, helper}) {
  const exportedName = module.getExportedName(cls.name);
  let importCode;
  if (exportedName === 'default') {
    importCode = `import ${cls.name} from '${module.id}';`;
  } else {
    importCode = `import {${exportedName}} from '${module.id}';`;
  }

  return (
    <div>
      <h3>{cls.name}</h3>
      <Code value={importCode} />
      <Markdown source={cls.doc.classdesc} renderers={{code: Code}} />
      <h6>Parameters</h6>
      <ul>
        {cls.doc.params && cls.doc.params.map(param => <Parameter param={param} module={module} helper={helper} />)}
      </ul>
    </div>
  );
}

Class.propTypes = {
  cls: object.isRequired,
  module: object.isRequired,
  helper: object.isRequired
};

export default Class;
