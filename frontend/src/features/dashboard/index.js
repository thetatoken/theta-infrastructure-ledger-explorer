import React, { Component } from "react";
import BlockchainOverView from "./components/blockchain-overview";
import BlocksOverView from "./components/blocks-overview";
import TransactionsOverView from "./components/transactions-overview";
// import './styles.scss';

export default class Dashboard extends Component {
  render() {
    const { backendAddress } = this.props.route;
    return (
      <div className="th-dashboard">
        <div className="th-dashboard__title">Welcome to Theta Explorer</div>
        <div className="th-dashboard__container">
          <BlocksOverView backendAddress={backendAddress} />
          <TransactionsOverView backendAddress={backendAddress} />
          {/* <BlockchainOverView /> */}
        </div>
      </div>
    );
  }
}