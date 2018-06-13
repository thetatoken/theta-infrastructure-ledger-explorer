import React, { Component } from "react";
import socketClient from 'socket.io-client';
import TransactionOverviewTable from 'features/transactions/components/transaction-overview-table';
import LinkButton from "common/components/link-button";
import '../styles.scss';

export default class TransactionsOverView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.backendAddress,
      // backendAddress: "localhost:3000",
      transactionInfoList: []
    };
    this.onSocketEvent = this.onSocketEvent.bind(this);
  }

  componentDidMount() {
    const { backendAddress } = this.state;

    // Initial the socket
    this.socket = socketClient(backendAddress);
    this.socket.on('event', this.onSocketEvent)

  }
  componentWillUnmount() {
    this.socket.disconnect();
  }
  onSocketEvent(data) {
    if (data.type == 'transaction_list') {
      this.setState({ transactionInfoList: data.body })
    }
  }

  render() {
    const { transactionInfoList } = this.state;
    return (
      <div className="th-overview">
        <div className="th-overview__title">Transactions overview</div>
        {transactionInfoList !== undefined ?
          <TransactionOverviewTable transactionInfoList={transactionInfoList} /> : <div></div>}
        <div className="th-overview__button">
          <LinkButton className="th-overview__button--a" url="/txs">View All</LinkButton>
        </div>
      </div>
    );
  }
}