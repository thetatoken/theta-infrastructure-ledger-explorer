import React, { Component } from "react";
import { Link } from 'react-router-dom';
import _ from 'lodash';
import cx from 'classnames';

import { formatCoin, sumCoin, priceCoin } from 'common/helpers/utils';
import { hash } from 'common/helpers/transactions';
import { TxnTypeText, TxnClasses } from 'common/constants';
const TRUNC = 2;


export default class StakeTxsTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      type: this.props.type,
      transactions: this.props.txs.slice(0, TRUNC),
      isSliced: true
    };
  }
  static defaultProps = {
    includeDetails: true,
    truncate: window.screen.width <= 560 ? 10 : 35,
  }
  componentDidUpdate(preProps){
    if(preProps.txs !== this.props.txs){
        this.setState({ transactions: this.props.txs.slice(0, TRUNC), isSliced: true })
    }
  }
  toggleList() {
    if (this.state.isSliced) {
      this.setState({ transactions: this.props.txs, isSliced: false })
    } else {
      this.setState({ transactions: this.props.txs.slice(0, TRUNC), isSliced: true })
    }
  }

  render() {
    const { txs, type, className, truncate, price } = this.props;
    const { transactions, isSliced } = this.state;
    let sum = txs.reduce((sum, tx) => { return sumCoin(sum, tx.amount) }, 0);
    return (
      <div className="stakes">
        <div className="title">{type === 'source' ? 'TOKENS STAKED BY THIS ADDRESS TO VALIDATOR/GUARDIAN NODES' : 'TOKENS STAKED TO THIS NODE'}</div>
        <table className={cx("data txn-table", className)}>
          <thead>
            <tr>
              <th className="node-type">NODE TYPE</th>
              {type === 'source' && <th className="token left">TOKENS STAKED</th>}
              <th className="address">{type === 'source' ? 'TO NODE' : 'FROM ADDRESS'}</th>
              {/* <th className="txn">STAKING TX</th> */}
              <th className="status">STATUS</th>
              {type !== 'source' && <th className="token">TOKENS STAKED</th>}
            </tr>
          </thead>
          <tbody className="stake-tb">
            {_.map(transactions, record => {
              const address = type === 'holder' ? record.source : record.holder;
              return (
                <tr key={record._id}>
                  <td className={cx("node-type", record.type)}>{record.type === 'vcp' ? 'Validator' : 'Guardian'}</td>
                  {type === 'source' && <td className="token left"><div className="currency thetawei left">{formatCoin(record.amount)} Theta</div></td>}
                  <td className="address"><Link to={`/account/${address}`}>{_.truncate(address, { length: truncate })}</Link></td>
                  {/* <td className="txn"><Link to={`/txs/${record.txn}`}>{hash(record, truncate)}</Link></td> */}
                  <td className="status">{record.withdrawn ? 'Pending Withdrawal' : 'Staked'}</td>
                  {type !== 'source' && <td className="token"><div className="currency thetawei">{formatCoin(record.amount)} {window.screen.width <= 560 ? '' : 'Theta'}</div></td>}
                </tr>);
            })}
            {txs.length > TRUNC &&
              <tr>
                <td className="arrow-container" colSpan='4' onClick={this.toggleList.bind(this)}>
                  View {isSliced ? 'More' : 'Less'}
                </td>
              </tr>
            }
            <tr><td className="empty"></td></tr>
            <tr>
              <td></td>
              <td className={cx("token", { 'left': type === 'source' })} colSpan='3'>
                <div className={cx("currency thetawei", { 'left': type === 'source' })}>{formatCoin(sum)} Theta </div>
                {type === 'source' && <div className='price'>&nbsp;{`[\$${priceCoin(sum, price['Theta'])} USD]`}</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>);
  }
}



