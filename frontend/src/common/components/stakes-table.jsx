import React, { Component } from "react";
import { Link } from "react-router";
import socketClient from 'socket.io-client';
import { browserHistory } from 'react-router';
import cx from 'classnames';
import { formatCoin, sumCoin } from 'common/helpers/utils';

import { averageFee, hash, age, date } from 'common/helpers/blocks';

export default class StakesTable extends Component {

  constructor(props) {
    super(props);
    this.state = {

    };

  }
  static defaultProps = {

  }

  componentDidMount() {
  }

  render() {
    const { className, stakes, type, truncate, totalStaked } = this.props;
    return (
      <div className="stakes half">
        <div className="title">{type === 'node' ? 'TOP VALIDATOR / GUARDIAN NODES' : 'TOP STAKING WALLETS'}</div>
        <table className={cx("data txn-table", className)}>
          <thead>
            <tr>
              <th className="address">ADDRESS</th>
              {type === 'node' && <th className="type">TYPE</th>}
              <th className="staked">TOKENS STAKED</th>
              <th className="staked%">%STAKED</th>
            </tr>
          </thead>
          <tbody className="stake-tb">
            {_.map(stakes.slice(0, 8), record => {
              console.log(record)
              const address = type === 'node' ? record.holder : record.source;
              console.log(address)
              return (
                <tr key={address}>
                  <td className="address"><Link to={`/account/${address}`}>{_.truncate(address, { length: truncate })}</Link></td>
                  {type === 'node' && <td className="type">{record.type === 'vcp' ? 'Validator' : 'Guardian'}</td>}
                  <td className="staked"><div className="currency thetawei">{formatCoin(record.amount)}</div></td>
                  <td className="staked%">{(record.amount / totalStaked * 100).toFixed(2)}%</td>
                </tr>);
            })}
            <tr><td className="empty"></td></tr>
            <tr>
              <td></td>
              {type === 'node' && <td></td>}
              <td className="staked"><div className="currency thetawei">{formatCoin(totalStaked)}</div></td>
              <td className="staked%">100%</td>
            </tr>
          </tbody>
        </table>
      </div>);
  }
}
