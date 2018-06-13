import React, { Component } from "react";
import { browserHistory } from 'react-router';
import TransactionExplorerTable from './transaction-explorer-table';
import { transactionsService } from '/common/services/transaction';
import NotExist from 'common/components/not-exist';
import '../styles.scss';

export default class TransactionExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.route.backendAddress,
      // backendAddress: "localhost:9000",
      transactionInfo: null,
      totalTransactionsNumber: undefined,
      errorType: null
    };
  }
  componentWillUpdate(nextProps) {
    if (nextProps.params.transactionHash !== this.props.params.transactionHash) {
      this.getOneTransactionByUuid(nextProps.params.transactionHash);
    }
  }
  componentDidMount() {
    const { transactionHash } = this.props.params;
    browserHistory.push(`/txs/${transactionHash}`);
    this.getOneTransactionByUuid(transactionHash);
  }
  getOneTransactionByUuid(hash) {
    if (hash) {
      transactionsService.getOneTransactionByUuid(hash)
        .then(res => {
          switch (res.data.type) {
            case 'transaction':
              this.setState({
                transactionInfo: res.data.body,
                totalTransactionsNumber: res.data.totalTxsNumber,
                errorType: null
              })
              break;
            case 'error_not_found':
              this.setState({
                errorType: 'error_not_found'
              });
          }
        }).catch(err => {
          console.log(err);
        })
    } else {
      this.setState({
        errorType: 'error_not_found'
      });
      console.log('Wrong Height')
    }
  }
  renderContent() {
    const { transactionInfo, errorType } = this.state;
    return (
      errorType === 'error_not_found' ? <NotExist /> :
        <div>
          {transactionInfo !== null ?
            <TransactionExplorerTable transactionInfo={transactionInfo} /> : <div></div>}
        </div>
    )
  }
  render() {
    const { transactionHash } = this.props.params;
    return (
      <div className="th-explorer">
        <div className="th-explorer__title">
          <span>Transaction Detail: {transactionHash}</span>
        </div>
        <div className="th-explorer-table">
          {this.renderContent()}
        </div>
      </div>
    );
  }
}