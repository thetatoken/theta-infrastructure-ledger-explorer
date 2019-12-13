import React, { Component } from "react";
import { browserHistory, Link } from 'react-router';
import _ from 'lodash';
import cx from 'classnames';

import { formatCoin, sumCoin } from 'common/helpers/utils';
import { hash } from 'common/helpers/transactions';
import { TxnTypeText, TxnClasses } from 'common/constants';
const TRUNC = 2;


export default class StakeTxsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      type: this.props.type,
      transaction: this.props.txs.slice(0, TRUNC),
      isSliced: true
    };
  }
  static defaultProps = {
    includeDetails: true,
    truncate: 20,
  }

  toggleList() {
    if (this.state.isSliced) {
      this.setState({ transaction: this.props.txs, isSliced: false })
    } else {
      this.setState({ transaction: this.props.txs.slice(0, TRUNC), isSliced: true })
    }
  }

  render() {
    const { txs, type, className, truncate } = this.props;
    const { transaction, isSliced } = this.state;
    let sum = txs.reduce((sum, tx) => { return sumCoin(sum, tx.amount) }, 0);
    return (
      <div className="stakes">
        <div className="title">{type === 'source' ? 'TOKENS STAKED BY THIS ADDRESS TO VALIDATOR/GUARDIAN NODES' : 'TOKENS STAKED TO THIS NODE'}</div>
        <table className={cx("data txn-table", className)}>
          <thead>
            <tr>
              <th className="address">{type === 'source' ? 'TO NODE' : 'FROM ADDRESS'}</th>
              <th className="txn">STAKING TX</th>
              <th className="status">STATUS</th>
              <th className="token">TOKENS STAKED</th>
            </tr>
          </thead>
          <tbody className="stake-tb">
            {_.map(transaction, record => {
              // sum = sumCoin(record.amount, sum);
              const address = type === 'holder' ? record.source : record.holder;
              return (
                <tr key={record._id}>
                  <td className="address"><Link to={`/account/${address}`}>{_.truncate(address, { length: truncate })}</Link></td>
                  <td className="txn"><Link to={`/txs/${record.txn}`}>{hash(record, truncate)}</Link></td>
                  <td className="status">{record.withdrawn ? 'Pending' : 'Staked'}</td>
                  <td className="token">{formatCoin(record.amount)} Theta</td>
                </tr>);
            })}
            {txs.length > TRUNC &&
              <tr>
                <td className="arrow-container" colSpan="4" onClick={this.toggleList.bind(this)}>
                  View {isSliced ? 'More' : 'Less'}
                </td>
              </tr>
            }
            <tr><td className="empty"></td></tr>
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td className="token">{formatCoin(sum)} Theta</td>
            </tr>
          </tbody>
        </table>
        {/* <div className="arrow-container" onClick={this.toggleList.bind(this)}>
          {
            isSliced ? <p><i className="arrow down" /><i className="arrow down" /><i className="arrow down" /></p> :
              <p><i className="arrow up" /><i className="arrow up" /><i className="arrow up" /></p>
          }
        </div>
        <div className="total">{formatCoin(sum)}</div> */}
      </div>);
  }
}



