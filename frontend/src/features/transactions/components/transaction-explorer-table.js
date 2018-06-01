import React, { Component } from "react";
import { Link } from "react-router"
// import '../styles.scss';
const nameMap = {
  'fee': 'Fee',
  'gas': 'Gas',
  'pmt_sqnc': 'Payment Sequence',
  'rsv_sqnc': 'Reserve Sequence',
  'source': 'Source Address',
  'target': 'Target Address'
}
export default class TransactionExplorerTable extends Component {
  renderContent(key) {
    const { transactionInfo } = this.props;
    switch (key) {
      case 'fee':
        return transactionInfo['fee'].amount;
        break;
      case 'gas':
        return transactionInfo['gas'];
      case 'pmt_sqnc':
        return transactionInfo['pmt_sqnc'];
      case 'rsv_sqnc':
        return transactionInfo['rsv_sqnc'];
      case 'source':
        return transactionInfo['source'].address;
      case 'target':
        return transactionInfo['target'].address;
      case 'Amount':
        return this.getAmount();
      default:
        return null;
    }
  }
  getAmount() {
    const { transactionInfo } = this.props;
    var sum = 0, type;
    if (transactionInfo !== undefined && transactionInfo.source !== undefined
      && transactionInfo.source.coins !== undefined) {
      sum = transactionInfo.source.coins.reduce((sum, coin) => sum += coin.amount, sum);
      type = transactionInfo.source.coins[0].denom;
    }
    return sum === 0 && type !== undefined ? 0 : sum + ' ' + type;
    // transactionInfo.source
  }
  render() {
    const { transactionInfo } = this.props;
    return (
      <div className="th-be-table">
        <div className="th-be-table__row">
          <div className="th-be-table__row--left">Amount</div>
          <div className="th-be-table__row--right">
            {this.renderContent('Amount')}
          </div>
        </div>
        {Object.keys(transactionInfo).map(key => {
          if (key !== 'uuid') {
            return (
              <div className="th-be-table__row" key={key}>
                <div className="th-be-table__row--left">{nameMap[key]}</div>
                <div className="th-be-table__row--right">
                  {this.renderContent(key)}
                </div>
              </div>
            )
          } else return <div key={key}></div>
        })}
      </div>
    );
  }
}
