import React, { Component } from "react";
import { browserHistory } from 'react-router';
import TransactionExplorerTable from './transaction-explorer-table';
import { transactionsService } from '/common/services/transaction';
import { Link } from "react-router"
import LinkButton from "common/components/link-button";
import '../styles.scss';

export default class TransactionExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      // backendAddress: "52.53.243.120:9000",
      backendAddress: "localhost:9000",
      transactionInfo: null,
      totalTransactionsNumber: undefined
    };
  }
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.params.transactionNum !== this.props.params.transactionNum) {
      this.getOneTransactionByUuid(nextProps.params.transactionNum);
    }
  }
  componentDidMount() {
    const { transactionNum } = this.props.params;
    browserHistory.push(`/txs/${transactionNum}`);

    const { backendAddress } = this.state;
    this.getOneTransactionByUuid(transactionNum);
  }
  getOneTransactionByUuid(uuid) {
    const { totalTransactionsNumber } = this.state;
    if (totalTransactionsNumber === undefined
      || totalTransactionsNumber >= uuid
      || uuid > 0) {
      transactionsService.getOneTransactionByUuid(uuid)
        .then(res => {
          if (res.data.type == 'transaction') {
            this.setState({
              transactionInfo: res.data.body,
              totalTransactionsNumber: res.data.totalTxsNumber
            })
          }
        }).catch(err => {
          console.log(err);
        })
    } else {
      console.log('Wrong Height')
    }
  }
  renderNoMoreMsg() {
    return (
      <div className="th-block-explorer__buttons--no-more">No More</div>
    )
  }
  render() {
    const { transactionInfo, totalTransactionsNumber } = this.state;
    const uuid = Number(this.props.params.transactionNum);
    const sequence = transactionInfo ? transactionInfo.pmt_sqnc : null;
    return (
      <div className="th-transaction-explorer">
        {/* <Link to={"/blocks"}><button>Back to Blocks</button></Link> */}
        {/* <Link to={`/blocks/${height - 1}`}><button>{height - 1}</button></Link>
        <Link to={`/blocks/${height + 1}`}><button>{height + 1}</button></Link> */}
        {/* {blockInfo !== null ?
          <BlockInfoRows blockInfoList={[blockInfo]} /> : <div></div>} */}
        <div className="th-block-explorer__title">
          {/* <LinkButton url={"/blocks"} className="th-be-button__back">Back to Blocks</LinkButton> */}
          <span>Transaction Detail: {sequence}</span>
        </div>
        <div className="th-block-explorer__buttons">
          {uuid > 1 ?
            <LinkButton className="th-block-explorer__buttons--prev" url={`/txs/${uuid - 1}`} left>Prev</LinkButton>
            : this.renderNoMoreMsg()
          }
          {totalTransactionsNumber > uuid ?
            <LinkButton className="th-block-explorer__buttons--next" url={`/txs/${uuid + 1}`} right>Next</LinkButton>
            : this.renderNoMoreMsg()
          }
        </div>
        {transactionInfo !== null ?
          <TransactionExplorerTable transactionInfo={transactionInfo} /> : <div></div>}
      </div>
    );
  }
}