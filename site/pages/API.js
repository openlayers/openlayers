import {object} from 'prop-types';
import React from 'react';
import {Page} from '../components/layout';
import Module from '../components/Module';
import {getHelper} from '../util/api';

function API({pageContext: {docs}}) {
  const helper = getHelper(docs);

  return (
    <Page>
      <h1>API</h1>
      {helper.modules
        .filter(module => module.visible)
        .map(module => (
          <Module key={module.id} module={module} />
        ))}
    </Page>
  );
}

API.propTypes = {
  pageContext: object.isRequired
};

export default API;
