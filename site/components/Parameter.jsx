import {object} from 'prop-types';
import React from 'react';
import Type from './Type';

function Parameter({param, module, helper}) {
  return (
    <li>
      <code>{param.name}</code> - {param.description} {param.optional && <span>(optional)</span>}<br/>
      {param.type.names.map(longName => <Type longName={longName} module={module} helper={helper} />)}
    </li>
  );
}

Parameter.propTypes = {
  param: object.isRequired,
  module: object.isRequired,
  helper: object.isRequired
};

export default Parameter;
