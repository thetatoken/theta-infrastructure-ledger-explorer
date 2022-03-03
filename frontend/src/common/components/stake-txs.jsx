import React from "react";
import { Link } from 'react-router-dom';
import map from 'lodash/map';
import _truncate from 'lodash/truncate'
import cx from 'classnames';

import { formatCoin, sumCoin, priceCoin } from 'common/helpers/utils';
import { nodeTypes } from 'common/constants';

const TRUNC = 2;
const TitleMap = {
  'theta_source': 'THETA TOKENS STAKED BY THIS ADDRESS TO VALIDATOR/GUARDIAN NODES',
  'theta_holder': 'THETA TOKENS STAKED TO THIS NODE',
  'tfuel_source': 'TFUEL TOKENS STAKED BY THIS ADDRESS TO ELITE EDGE NODES',
  'tfuel_holder': 'TFUEL TOKENS STAKED TO THIS NODE'
}

export default class StakeTxsTable extends React.PureComponent {
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
  componentDidUpdate(preProps) {
    if (preProps.txs !== this.props.txs) {
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
    const { txs, type, stakeCoinType, className, truncate, price } = this.props;
    const { transactions, isSliced } = this.state;
    let sum = txs.reduce((sum, tx) => { return sumCoin(sum, tx.withdrawn ? 0 : tx.amount) }, 0);
    const titleKey = `${stakeCoinType}_${type}`;
    const currencyUnit = stakeCoinType === 'tfuel' ? 'tfuelwei' : 'thetawei';
    const currency = stakeCoinType === 'tfuel' ? 'TFuel' : 'Theta';
    return (
      <div className="stakes">
        <div className="title">{TitleMap[titleKey]}</div>
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
            {map(transactions, record => {
              const address = type === 'holder' ? record.source : record.holder;
              return (
                <tr key={record._id}>
                  <td className={cx("node-type", record.type)}>{nodeTypes[record.type]}</td>
                  {type === 'source' && <td className="token left"><div className={cx("currency", currencyUnit, "left")}>{`${formatCoin(record.amount)} ${currency}`}</div></td>}
                  <td className="address">
                    <AddressTNS address={address} tns={record.toTns} truncate={truncate} />
                  </td>
                  {/* <td className="txn"><Link to={`/txs/${record.txn}`}>{hash(record, truncate)}</Link></td> */}
                  <td className="status">{record.withdrawn ? 'Pending Withdrawal' : 'Staked'}</td>
                  {type !== 'source' && <td className="token"><div className={cx("currency", currencyUnit)}>{formatCoin(record.amount)} {window.screen.width <= 560 ? '' : currency}</div></td>}
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
                <div className={cx("currency", currencyUnit, { 'left': type === 'source' })}>{`${formatCoin(sum)} ${currency}`} </div>
                {type === 'source' && <div className='price'>&nbsp;{`[\$${priceCoin(sum, price[`${currency}`])} USD]`}</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>);
  }
}

const AddressTNS = ({ address, tns, truncate }) => {
  if (tns) {
    return (
      <div className="value tooltip">
        <div className="tooltip--text">
          <p>{tns}</p>
          <p>({address})</p>
        </div>
        <Link to={`/account/${address}`}>{_truncate(tns, { length: truncate })}</Link>
      </div>);
  }
  return (<Link to={`/account/${address}`}>{_truncate(address, { length: truncate })}</Link>)
}