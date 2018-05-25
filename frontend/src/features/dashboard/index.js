import React, { Component } from "react";
import BlocksOverView from "./components/blocks-overview";
import TransactionOverView from "./components/transaction-overview";
// import './styles.scss';

export default class Dashboard extends Component {
  render() {
    return (
      <div>
        <div className="th-dashboard__title">Webcome to Theta Explorer</div>
        <div className="th-dashboard__container">
          <BlocksOverView />
          <TransactionOverView />
        </div>
      </div>
    );
  }
}