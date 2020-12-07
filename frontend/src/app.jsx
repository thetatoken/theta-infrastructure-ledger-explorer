import React from "react";
import Header from 'common/components/header'
export default class App extends React.Component {
  render() {
    return (
      <div id="app-container">
        <Header />
        <React.StrictMode>
        <div id="app-content">
          {this.props.children}
        </div> 
        </React.StrictMode>
      </div>
    );
  }
}