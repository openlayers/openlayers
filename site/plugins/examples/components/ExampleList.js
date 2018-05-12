import React, {Component} from 'react';
import {object} from 'prop-types';
import injectSheet from 'react-jss';
import Link from 'gatsby-link';

class ExampleList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      index: null
    };
  }

  componentDidMount() {
    fetch('../index.json')
      .then(response => response.json())
      .then(index => {
        this.setState({index});
      });
  }

  renderList() {
    const index = this.state.index;
    if (!index) {
      return '...';
    }

    const list = [];
    for (const id in index) {
      const example = index[id];
      list.push(
        <li key={id}>
          <Link to={example.slug}>{example.title}</Link>
        </li>
      );
    }
    return <ul className={this.props.classes.list}>{list}</ul>;
  }

  render() {
    return (
      <div className={this.props.classes.wrapper}>{this.renderList()}</div>
    );
  }
}

ExampleList.propTypes = {
  classes: object.isRequired
};

const styles = {
  wrapper: {
    minWidth: '10em'
  },
  list: {
    margin: 0,
    listStyle: 'none'
  }
};

export default injectSheet(styles)(ExampleList);
