import React, {Component} from 'react';
import {object} from 'prop-types';
import Link from 'gatsby-link';

class Examples extends Component {
  renderExample({node}) {
    const context = node.context;
    return (
      <li key={node.id}>
        <Link to={context.slug}>{context.frontmatter.title}</Link>
      </li>
    );
  }

  render() {
    return <ul>{this.props.data.allSitePage.edges.map(this.renderExample)}</ul>;
  }
}

Examples.propTypes = {
  data: object.isRequired
};

export const query = graphql`
  query ExampleList {
    allSitePage(filter: {pluginCreator: {name: {eq: "examples"}}}) {
      edges {
        node {
          id
          context {
            slug
            frontmatter {
              title
            }
          }
        }
      }
    }
  }
`;

export default Examples;
