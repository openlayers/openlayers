import React from 'react';
import injectSheet from 'react-jss';
import {object, func} from 'prop-types';
import Link from 'gatsby-link';

const Layout = ({classes, children}) => (
  <div className={classes.layout}>
    <header className={classes.header}>
      <h1>
        <Link to="/">OpenLayers</Link>
      </h1>
      <div>
        <Link to="/examples/">examples</Link>
      </div>
    </header>
    <main className={classes.main}>{children()}</main>
  </div>
);

Layout.propTypes = {
  children: func.isRequired,
  classes: object.isRequired
};

const styles = {
  layout: {
    margin: '1em auto',
    maxWidth: '960px'
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    padding: '0 2em',
    marginBottom: '2em',
    '& h1': {
      margin: '0 auto 0 0'
    }
  },
  main: {
    padding: '0 2em'
  }
};

export default injectSheet(styles)(Layout);
