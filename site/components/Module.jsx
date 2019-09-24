import {object} from 'prop-types';
import React from 'react';
import Class from './Class';
import Func from './Func';

function Module({module, helper}) {
  return (
    <div>
      <hr />
      <h2>{module.id}</h2>
      {module.classes.map(cls => (
        <Class key={cls.name} cls={cls} module={module} helper={helper} />
      ))}
      {module.functions.map(func => (
        <Func key={func.name} func={func} module={module} helper={helper} />
      ))}
    </div>
  );
}

Module.propTypes = {
  module: object.isRequired,
  helper: object.isRequired
};

export default Module;
