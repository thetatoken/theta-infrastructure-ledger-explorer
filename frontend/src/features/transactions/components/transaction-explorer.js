import React, { Component } from "react";
import { browserHistory } from 'react-router';
import TransactionExplorerTable from './transaction-explorer-table';
import { transactionsService } from '/common/services/transaction';
import { Link } from "react-router"
import LinkButton from "common/components/link-button";
import NotExist from 'common/components/not-exist';
import '../styles.scss';

export default class TransactionExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      // backendAddress: "52.53.243.120:9000",
      backendAddress: "localhost:9000",
      transactionInfo: null,
      totalTransactionsNumber: undefined,
      errorType: null
    };
  }
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.params.transactionHash !== this.props.params.transactionHash) {
      this.getOneTransactionByUuid(nextProps.params.transactionHash);
    }
  }
  componentDidMount() {
    const { transactionHash } = this.props.params;
    browserHistory.push(`/txs/${transactionHash}`);

    const { backendAddress } = this.state;
    this.getOneTransactionByUuid(transactionHash);
  }
  getOneTransactionByUuid(hash) {
    const { totalTransactionsNumber } = this.state;
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
  renderNoMoreMsg() {
    return (
      <div className="th-block-explorer__buttons--no-more">No More</div>
    )
  }
  renderContent() {
    const { transactionInfo, totalTransactionsNumber, errorType } = this.state;
    const uuid = Number(this.props.params.transactionHash);
    return (
      errorType === 'error_not_found' ? <NotExist /> :
        <div>
          {/* <div className="th-block-explorer__buttons">
            {uuid > 1 ?
              <LinkButton className="th-block-explorer__buttons--prev" url={`/txs/${uuid - 1}`} left>Prev</LinkButton>
              : this.renderNoMoreMsg()
            }
            {totalTransactionsNumber > uuid ?
              <LinkButton className="th-block-explorer__buttons--next" url={`/txs/${uuid + 1}`} right>Next</LinkButton>
              : this.renderNoMoreMsg()
            }
          </div> */}
          {transactionInfo !== null ?
            <TransactionExplorerTable transactionInfo={transactionInfo} /> : <div></div>}
        </div>
    )
  }
  render() {
    const { transactionInfo } = this.state;
    const { transactionHash } = this.props.params;
    return (
      <div className="th-transaction-explorer">
        <div className="th-block-explorer__title">
          <span>Transaction Detail: {transactionHash}</span>
        </div>
        {this.renderContent()}
      </div>
    );
  }
}