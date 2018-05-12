import Link from 'gatsby-link';
import React, {Component} from 'react';
import styled from 'react-emotion';

const Wrapper = styled('div')({
  minWidth: '10em'
});

const List = styled('ul')({
  margin: 0,
  listStyle: 'none'
});

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
    return <List>{list}</List>;
  }

  render() {
    return <Wrapper>{this.renderList()}</Wrapper>;
  }
}

export default ExampleList;
