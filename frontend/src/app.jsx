import React, { Component } from "react";
import Header from './common/components/header'
export default class App extends Component {
  render() {
    return (
      <div>
        <Header />
        {this.props.children}
      </div>
    );
  }
}