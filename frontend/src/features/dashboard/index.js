import React, { Component } from "react";
import BlocksOverView from "./components/blocks-overview";
// import './styles.scss';

export default class Dashboard extends Component {
  render() {
    return (
      <div>
        this is a dashboard
        <BlocksOverView />
      </div>
    );
  }
}