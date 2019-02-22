import React, { Component } from "react";
import Header from './common/components/header'
export default class App extends Component {
  render() {
    return (
      <div className="theta-container">
        <Header />
        <div className="theta-content">
          {this.props.children}
        </div> 
      </div>
    );
  }
}