import {object} from 'prop-types';
import React from 'react';
import Parameter from './Parameter';

function Type({longName, module, helper}) {
  const type = helper.getTypeDef(longName);
  if (!type) {
    return <code>{longName}</code>;
  }

  return (
    <div>
      <code>{type.doc.type.names}</code>
      <ul>
        {type.doc.properties && type.doc.properties.map(prop => <Parameter param={prop} module={module} helper={helper} />)}
      </ul>
    </div>
  );
}

Type.propTypes = {
  longName: object.isRequired,
  module: object.isRequired,
  helper: object.isRequired
};

export default Type;
