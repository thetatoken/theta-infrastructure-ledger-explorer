import React, { Component } from "react";
import { browserHistory } from 'react-router';
import { transactionsService } from '/common/services/transaction';
import TransactionInfoRows from './components/transaction-info-rows';
import LinkButton from "common/components/link-button";
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

  handleGetTransactionsByPage(pageNumber, type) {
    transactionsService.getTransactionsByPage(pageNumber)
      .then(res => {
        this.receivedTransactionsEvent(res);
      }).catch(err => {
        console.log(err);
      })
  }

  renderPrevPageButton() {
    let { currentPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    return (
      Number(currentPageNumber) !== 1 ?
        <LinkButton className="th-blocks-button__left" left handleOnClick={() => this.handleGetTransactionsByPage(currentPageNumber - 1)}>Prev</LinkButton>
        : <div></div>
    );
  }

  renderNextPageButton() {
    let { currentPageNumber, totalPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    totalPageNumber = Number(totalPageNumber);
    return (
      currentPageNumber !== totalPageNumber ?
        <LinkButton className="th-blocks-button__right" right handleOnClick={() => this.handleGetTransactionsByPage(currentPageNumber + 1)} >Next</LinkButton>
        : <div></div>
    );
  }

  render() {
    const { transactionInfoList } = this.state;
    let { currentPageNumber, totalPageNumber } = this.state;
    currentPageNumber = Number(currentPageNumber);
    totalPageNumber = Number(totalPageNumber);
    return (
      <div className="th-blocks">
        <div className="th-blocks-title">Transactions listing. Page: #{currentPageNumber + 1}</div>
        {transactionInfoList !== undefined ?
          <TransactionInfoRows transactionInfoList={transactionInfoList} size='full' /> : <div></div>}
        <div className="th-blocks-pagination">
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