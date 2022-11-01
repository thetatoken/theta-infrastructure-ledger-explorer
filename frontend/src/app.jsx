import React from "react";
import Header from 'common/components/header'
export default class App extends React.Component {
  render() {
    const { version, switchVersion } = this.props;
    return (
      <div id="app-container">
        <React.StrictMode>
          <Header version={version} switchVersion={switchVersion} />
          <div id="app-content">
            {this.props.children}
          </div>
        </React.StrictMode>
      </div>
    );
  }
}