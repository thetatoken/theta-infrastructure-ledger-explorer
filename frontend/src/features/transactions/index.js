import React, { Component } from "react";
import { browserHistory } from 'react-router';
import { transactionsService } from '/common/services/transaction';
import TransactionOverviewTable from './components/transaction-overview-table';
import Pagination from "common/components/pagination"
import './styles.scss';

export default class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      // backendAddress: "52.53.243.120:9000",
      backendAddress: "localhost:9000",
      // backendAddress: "localhost:3000",
      transactionInfoList: [],
      currentPageNumber: 0,
      totalPageNumber: 0
    };
    this.receivedTransactionsEvent = this.receivedTransactionsEvent.bind(this);
    this.handleGetTransactionsByPage = this.handleGetTransactionsByPage.bind(this);
  }

  componentDidMount() {
    browserHistory.push('/txs');

    const { currentPageNumber } = this.state;
    transactionsService.getTransactionsByPage(currentPageNumber)
      .then(res => {
        this.receivedTransactionsEvent(res);
      }).catch(err => {
        console.log(err);
      })
  }

  receivedTransactionsEvent(data) {
    if (data.data.type == 'transaction_list') {
      this.setState({
        transactionInfoList: data.data.body,
        currentPageNumber: data.data.currentPageNumber,
        totalPageNumber: data.data.totalPageNumber
      })
    }
  }

  handleGetTransactionsByPage(pageNumber) {
    transactionsService.getTransactionsByPage(pageNumber)
      .then(res => {
        this.receivedTransactionsEvent(res);
      }).catch(err => {
        console.log(err);
      })
  }

  render() {
    const { transactionInfoList } = this.state;
    let { currentPageNumber, totalPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    totalPageNumber = Number(totalPageNumber);
    return (
      <div className="theta-content__container">
        <div className="theta-content__container--title">Transactions listing. Page: #{currentPageNumber + 1}</div>
        {transactionInfoList !== undefined ?
          <TransactionOverviewTable transactionInfoList={transactionInfoList} size='full' /> : <div></div>}
        <div className="theta-content__container--pagination">
          <Pagination
            size={'lg'}
            totalPages={totalPageNumber}
            currentPage={currentPageNumber}
            callback={this.handleGetTransactionsByPage}
          />
        </div>
      </div>
    );
  }
}