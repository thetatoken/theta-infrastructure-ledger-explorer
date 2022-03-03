import React from "react";
import history from 'common/history'
import { Link } from 'react-router-dom';
import socketClient from 'socket.io-client';
import map from 'lodash/map';
import cx from 'classnames';
import truncate from 'lodash/truncate';

import { formatCoin, priceCoin } from 'common/helpers/utils';
import { from, to, hash, age, date, type, coins } from 'common/helpers/transactions';
import { TxnClasses } from 'common/constants';



export default class TransactionTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      transactions: [],
      account: null
    };
    this.onSocketEvent = this.onSocketEvent.bind(this);
  }
  static defaultProps = {
    includeDetails: true,
    truncate: 20,
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.transactions && nextProps.transactions.length && nextProps.transactions !== prevState.transactions) {
      let txs = nextProps.transactions.sort((a, b) => b.block_height - a.block_height);
      return { transactions: txs, account: nextProps.account };
    }
    return prevState;
  }
  componentDidMount() {
    const { backendAddress } = this.state;
    const { updateLive } = this.props;

    // Initial the socket
    if (updateLive && backendAddress) {
      this.socket = socketClient(backendAddress);
      this.socket.on('PUSH_TOP_TXS', this.onSocketEvent)
    }
  }
  componentWillUnmount() {
    if (this.socket)
      this.socket.disconnect();
  }
  onSocketEvent(data) {
    if (data.type == 'transaction_list') {
      let transactions = (data.body || []).sort((a, b) => b.number - a.number);
      this.setState({ transactions })
    }
  }
  handleRowClick = (hash) => {
    history.push(`/txs/${hash}`);
  }

  render() {
    const { className, includeDetails, truncate, account, price } = this.props;
    const { transactions } = this.state;
    const address = account ? account.address : null;
    const txSet = new Set();
    return (
      <table className={cx("data txn-table", className)}>
        <thead>
          <tr>
            <th className="type">Type</th>
            <th className="hash">Txn Hash</th>
            {includeDetails &&
              <React.Fragment>
                <th className="block">Block</th>
                <th className="age">Age</th>
                <th className="from">From</th>
                <th className={cx("icon", { 'none': !account })}></th>
                <th className="to">To</th>
                <th className="value">Value</th>
              </React.Fragment>}
          </tr>
        </thead>
        <tbody>
          {map(transactions, (txn, i) => {
            let source = null;
            source = !account ? 'none' : account.address === from(txn, null, address) ? 'from' : 'to';
            if (txSet.has(txn.hash)) source = 'to';
            return (
              <tr key={i} className={TxnClasses[txn.type]}>
                <td className="type">{type(txn)}</td>
                <td className="hash overflow"><Link to={`/txs/${txn.hash}`}>{hash(txn, truncate)}</Link></td>
                {includeDetails &&
                  <React.Fragment>
                    <td className="block">{txn.block_height}</td>
                    <td className="age" title={date(txn)}>{age(txn)}</td>
                    <td className={cx({ 'dim': source === 'to' }, "from")}>
                      <AddressTNS txn={txn} address={address} type="from" trunc={truncate} txSet={txSet} />
                    </td>
                    <td className={cx(source, "icon")}></td>
                    <td className={cx({ 'dim': source === 'from' }, "to")}>
                      <AddressTNS txn={txn} address={address} type="to" trunc={truncate} />
                    </td>
                    <td className="value"><Value coins={coins(txn, account)} price={price} /></td>
                  </React.Fragment>}
              </tr>);
          })}
        </tbody>
      </table>);
  }
}

const Value = ({ coins, price }) => {
  const isMobile = window.screen.width <= 560;
  return (
    <React.Fragment>
      <div className="currency theta">
        {formatCoin(coins.thetawei)}
        {!isMobile && "Theta"}
        {!isMobile && <div className='price'>{`[\$${priceCoin(coins.thetawei, price['Theta'])} USD]`}</div>}
      </div>
      <div className="currency tfuel">
        {formatCoin(coins.tfuelwei)}
        {!isMobile && "TFuel"}
        {!isMobile && <div className='price'>{`[\$${priceCoin(coins.tfuelwei, price['TFuel'])} USD]`}</div>}
      </div>
    </React.Fragment>)
}

const AddressTNS = ({ txn, address, type, trunc = 20, txSet }) => {
  if (type === 'from') {
    if (txn && txn.fromTns) {
      return (
        <div className="value tooltip">
          <div className="tooltip--text">
            <p>{txn.fromTns}</p>
            <p>({from(txn, null, address, txSet)})</p>
          </div>
          <Link to={`/account/${from(txn, null, address)}`}>{truncate(txn.fromTns, { length: trunc })}</Link>
        </div>);
    } else {
      return (<Link to={`/account/${from(txn, null, address)}`}>{from(txn, trunc, address, txSet)}</Link>)
    }
  } else if (type === 'to') {
    if (txn && txn.toTns) {
      return (
        <div className="value tooltip">
          <div className="tooltip--text">
            <p>{txn.toTns}</p>
            <p>({to(txn, null, address)})</p>
          </div>
          <Link to={`/account/${to(txn, null, address)}`}>{truncate(txn.toTns, { length: trunc })}</Link>
        </div>);
    } else {
      return (<Link to={`/account/${to(txn, null, address)}`}>{to(txn, trunc, address, txSet)}</Link>)
    }
  }
  return (<span></span>)
}