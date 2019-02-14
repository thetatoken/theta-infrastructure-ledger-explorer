import React, { Component } from "react";
import { Link } from "react-router";
import { BigNumber } from 'bignumber.js';

// import '../styles.scss';

export default class AccountExplorerTable extends Component {
  renderOneRow(leftContent, rightContent) {
    return (
      <div className="th-explorer-table__row">
        <div className="th-explorer-table__row--left">
          <p className="th-explorer-table-text">{leftContent}</p>
        </div>
        <div className="th-explorer-table__row--right">
          <div className="th-explorer-table-text">
            {rightContent}
          </div>
        </div>
      </div>
    )
  }
  renderBalance(balance) {
    let denoms = ['ThetaWei', 'TFuelWei'];
    let amounts = [balance.thetawei, balance.tfuelwei];
    return (
      <div className="th-explorer-table-text__balance">
        <div className="th-explorer-table-text__balance--left">
          {amounts.map((amount, i) => {
            return (
              <p key={i}>{BigNumber(amount, 10).toFormat(0)}</p>
            )
          })}
        </div>
        <div className="th-explorer-table-text__balance--right">
          {denoms.map(denom => {
            return (
              <p key={denom}>{denom}</p>
            )
          })}
        </div>
      </div>
    )
  }
  renderTransactionsHash(txsHashList) {
    return (
      <div className="th-explorer-table-text__txs_hash_list">
        {txsHashList.map(hash => {
          if (has)
            return (<Link key={hash} to={`/txs/${hash.toLowerCase()}`}>{hash.toLowerCase()}</Link>)
        })}
      </div>
    )
  }
  renderReservedFunds(funds) {
    // TODO: NEED TO REVISE LATER
    return funds === "null" ? 'null' : 'Such a complex object';
  }
  renderToBlock(height) {
    const newTo = {
      pathname: `/blocks/${height}`,
      state: 'Coming Soon'
    };
    return (<Link to={newTo}>{height}</Link>)
  }
  render() {
    const { accountInfo } = this.props;
    return (
      <div className="th-explorer-table">
        {this.renderOneRow('Address', accountInfo.address.toLowerCase())}
        {this.renderOneRow('Sequence', accountInfo.sequence)}
        {/* {this.renderOneRow('Reserved Funds', this.renderReservedFunds(accountInfo.reserved_funds))} */}
        {/* {this.renderOneRow('Last Updated Block Height', this.renderToBlock(accountInfo.last_updated_block_height))} */}
        {this.renderOneRow('Balance', this.renderBalance(accountInfo.balance))}
        {this.renderOneRow('Most Recent Transactions', this.renderTransactionsHash(accountInfo.txs_hash_list))}
      </div>
    );
  }
}
