import {object} from 'prop-types';
import React from 'react';
import {Page} from '../components/layout';

function Info({pageContext: {docs}}) {
  return (
    <Page>
      <h1>API</h1>
      <table>
        <tbody>
          <tr>
            <th>kind</th>
            <th>longname</th>
            <th>memberof</th>
          </tr>
          {docs.map(doc => (
            <tr key={doc.longname}>
              <td>{doc.kind}</td>
              <td>{doc.longname}</td>
              <td>{doc.memberof}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Page>
  );
}

Info.propTypes = {
  pageContext: object.isRequired
};

export default Info;
