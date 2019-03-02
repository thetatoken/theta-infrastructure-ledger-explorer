import React, { Component } from "react";
import { browserHistory } from 'react-router';
import { Link } from "react-router";

import { transactionsService } from 'common/services/transaction';
import Pagination from "common/components/pagination";
import TransactionTable from "common/components/transactions-table";

const NUM_TRANSACTIONS = 50;

export default class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.route.backendAddress,
      transactions: [],
      currentPageNumber: 0,
      totalPageNumber: 0
    };
  }

  componentDidMount() {
    const { currentPageNumber } = this.state;
    transactionsService.getTransactionsByPage(currentPageNumber, NUM_TRANSACTIONS)
      .then(res => this.receivedTransactionsEvent(res))
      .catch(err => console.log(err))
  }

  receivedTransactionsEvent = (data) => {
    if (data.data.type == 'transaction_list') {
      this.setState({
        transactions: _.orderBy(data.data.body, 'number', 'desc'),
        currentPageNumber: data.data.currentPageNumber,
        totalPageNumber: data.data.totalPageNumber
      })
    }
  }

  handleGetTransactionsByPage = (pageNumber) => {
    transactionsService.getTransactionsByPage(pageNumber, NUM_TRANSACTIONS)
      .then(res => this.receivedTransactionsEvent(res))
      .catch(err => console.log(err))
  }

  handleRowClick = (hash) => {
    browserHistory.push(`/txs/${hash}`);
  }

  render() {
    const { transactions } = this.state;
    let { currentPageNumber, totalPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    totalPageNumber = Number(totalPageNumber);

    //console.log(transactions);
    return (
      <div className="content transactions">
        <div className="page-title transactions">Transactions</div>
        <TransactionTable transactions={transactions} />
        <Pagination
          size={'lg'}
          totalPages={totalPageNumber}
          currentPage={currentPageNumber}
          callback={this.handleGetTransactionsByPage} />
      </div>
    );
  }
}