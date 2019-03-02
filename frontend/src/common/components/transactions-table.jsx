import React, { Component } from "react";
import { Link } from "react-router";
import { browserHistory } from 'react-router';
import socketClient from 'socket.io-client';
import _ from 'lodash';
import cx from 'classnames';

import { truncateMiddle } from 'common/helpers/utils';
import { from, to, fee, value, hash, age, date, type } from 'common/helpers/transactions';
import { TxnTypes, TxnClasses } from 'common/constants';



export default class TransactionTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      transactions: [],
    };
    this.onSocketEvent = this.onSocketEvent.bind(this);
  }
  static defaultProps = {
    includeDetails: true,
    truncate: 25,
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if(nextProps.transactions && nextProps.transactions.length && nextProps.transactions !== prevState.transactions) {
      return { transactions: nextProps.transactions};
    }
    return prevState;
  }
  componentDidMount() {
    const { backendAddress } = this.state;
    const { updateLive } = this.props;

    // Initial the socket
    if(updateLive && backendAddress) {
      this.socket = socketClient(backendAddress);
      this.socket.on('PUSH_TOP_TXS', this.onSocketEvent) 
    }
  }
  componentWillUnmount() {
    if(this.socket)
      this.socket.disconnect();
  }
  onSocketEvent(data) {
    if (data.type == 'transaction_list') {
      let transactions = (data.body || []).sort((a, b) => b.number - a.number);
      this.setState({ transactions })
    }
  }

  handleRowClick = (hash) => {
    browserHistory.push(`/txs/${hash}`);
  }

  render() {
    const { className, includeDetails, truncate } = this.props;
    const { transactions } = this.state;
    return (
      <table className={cx("data txn-table", className)}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Transaction Hash</th>
            { includeDetails &&
            <React.Fragment>
              <th className="block">Block</th>
              <th className="age">Age</th>
              <th className="from">From</th>
              <th className="to">To</th>
              { /* <th className="value">value</th> */ }
            </React.Fragment>}
          </tr>
        </thead>
        <tbody>
          {_.map(transactions, txn => {
            return (
              <tr key={txn.hash} className={ TxnClasses[txn.type] }>
                <td className="type">{ type(txn) }</td>
                <td className="overflow"><Link to={`/txs/${txn.hash}`}>{ hash(txn, truncate) }</Link></td>
                { includeDetails &&
                <React.Fragment>
                  <td className="block">{ txn.block_height }</td>
                  <td className="age" title={ date(txn) }>{ age(txn) }</td>
                  <td className="from"><a href={`/account/${from(txn)}`}>{ from(txn, 16) }</a></td>
                  <td className="to"><a href={`/account/${to(txn)}`}>{ to(txn, 16) }</a></td>
                  { /* <td className="value">{ _.map(value(txn), v => <span>{v}</span>) }</td> */ }
                </React.Fragment>}
              </tr>);
          })}
        </tbody>
      </table>);
  }
}



