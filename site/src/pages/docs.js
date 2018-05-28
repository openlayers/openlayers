import React, {Component, Fragment} from 'react';
import Module from '../components/doc/Module';
import {getModules} from '../utils/doc';

import info from '../../../build/info.json';

const modules = getModules(info);

class Docs extends Component {
  render() {
    return (
      <Fragment>
        {modules.map(mod => <Module key={mod.name} {...mod} />)}
      </Fragment>
    );
  }
}

export default Docs;
