import React, { Component } from "react";
import Header from './views/header'
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