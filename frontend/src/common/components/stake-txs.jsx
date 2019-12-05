import React, { Component } from "react";
import { browserHistory, Link } from 'react-router';
import _ from 'lodash';
import cx from 'classnames';

import { formatCoin, sumCoin } from 'common/helpers/utils';
import { hash } from 'common/helpers/transactions';
import { TxnTypeText, TxnClasses } from 'common/constants';



export default class StakeTxsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      type: this.props.type,
      txs: this.props.txs
    };
  }
  static defaultProps = {
    includeDetails: true,
    truncate: 35,
  }

  render() {
    const { txs, type, className, truncate } = this.props;
    let sum = 0;
    return (
      <div className="stakes">
        <div className="title">{type === 'holder' ? 'TOKENS STAKED BY THIS ADDRESS TO VALIDATOR/GUARDIAN NODES' : 'TOKENS STAKED TO THIS NODE'}</div>
        <table className={cx("data txn-table", className)}>
          <thead>
            <tr>
              <th className="address">{type === 'holder' ? 'TO NODE' : 'FROM ADDRESS'}</th>
              <th className="txn">STAKING TX</th>
              <th className="token">TOKENS STAKED</th>
            </tr>
          </thead>
          <tbody className="stake-tb">
            {_.map(txs, record => {
              sum = sumCoin(record.amount, sum);
              const address = type === 'holder' ? record.source : record.holder;
              return (
                <tr key={record._id}>
                  <td className="address"><Link to={`/account/${address}`}>{_.truncate(address, { length: truncate })}</Link></td>
                  <td className="txn"><Link to={`/txs/${record.txn}`}>{hash(record, truncate)}</Link></td>
                  <td className="token">{formatCoin(record.amount)}</td>
                </tr>);
            })}
            <tr>
              <td></td>
              <td></td>
              <td className="token">{formatCoin(sum)}</td>
            </tr>
          </tbody>
        </table>
        <div className="total"></div>
      </div>);
  }
}



