import React, { Component } from "react";
import { browserHistory } from 'react-router';

import { getQueryParam } from 'common/helpers/utils';
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
      currentPage: 1,
      totalPages: 0,
      loading: false,
    };
  }
  
  componentDidMount() {
    const { currentPage } = this.state;
    this.fetchData(currentPage);
  }

  fetchData(currentPage) {
    this.setState({ loading: true });
    transactionsService.getTransactionsByPage(currentPage, NUM_TRANSACTIONS)
      .then(res => {
        if (res.data.type == 'transaction_list') {
          this.setState({
            transactions: _.orderBy(res.data.body, 'number', 'desc'),
            currentPage: _.toNumber(res.data.currentPageNumber),
            totalPages: _.toNumber(res.data.totalPageNumber),
            loading: false,
          })
        }
      })
      .catch(err => {
        this.setState({ loading: false });
        console.log(err)
      })
  }

  handlePageChange = (pageNumber) => {
    this.fetchData(pageNumber);
  }

  handleRowClick = (hash) => {
    browserHistory.push(`/txs/${hash}`);
  }

  render() {
    const { transactions, currentPage, totalPages, loading } = this.state;
    return (
      <div className="content transactions">
        <div className="page-title transactions">Transactions</div>
        <TransactionTable transactions={transactions} />
        <Pagination
          size={'lg'}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={this.handlePageChange}
          disabled={loading} />
      </div>
    );
  }
}