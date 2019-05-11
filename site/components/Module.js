import {object} from 'prop-types';
import React from 'react';
import Class from './Class';
import Func from './Func';

function Module({module}) {
  return (
    <div>
      <hr />
      <h2>{module.id}</h2>
      {module.classes.map(cls => (
        <Class key={cls.name} cls={cls} module={module} />
      ))}
      {module.functions.map(func => (
        <Func key={func.name} func={func} module={module} />
      ))}
    </div>
  );
}

Module.propTypes = {
  module: object.isRequired
};

export default Module;
