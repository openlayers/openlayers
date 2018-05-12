import {func} from 'prop-types';
import Link from 'gatsby-link';
import React from 'react';
import styled from 'react-emotion';

const Page = styled('div')({
  margin: '1em auto',
  maxWidth: '960px'
});

const Header = styled('header')({
  display: 'flex',
  alignItems: 'baseline',
  padding: '0 2em',
  marginBottom: '2em',
  '& h1': {
    margin: '0 auto 0 0'
  }
});

const Main = styled('main')({
  padding: '0 2em'
});

const Layout = ({children}) => (
  <Page>
    <Header>
      <h1>
        <Link to="/">OpenLayers</Link>
      </h1>
      <div>
        <Link to="/examples/">examples</Link>
      </div>
    </Header>
    <Main>{children()}</Main>
  </Page>
);

Layout.propTypes = {
  children: func.isRequired
};

export default Layout;
