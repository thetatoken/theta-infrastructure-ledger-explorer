import React, { Component } from "react";
import BlocksOverView from "./components/blocks-overview";
import TransactionsOverView from "./components/transactions-overview";
// import './styles.scss';

export default class Dashboard extends Component {
  render() {
    return (
      <div className="th-dashboard">
        <div className="th-dashboard__title">Welcome to Theta Explorer</div>
        <div className="th-dashboard__container">
          <BlocksOverView />
          <TransactionsOverView />
        </div>
      </div>
    );
  }
}