import React, { Component } from "react";
import { Link } from "react-router"
// import '../styles.scss';

export default class TransactionInfoRows extends Component {
  render() {
    const { transactionInfoList, size } = this.props;
    const className = size === 'full' ? "th-block-info-brief full" : "th-block-info-brief"
    return (
      <div className={className}>
        <table>
          <tbody>
            <tr>
              <th>Type</th>
              <th>Transaction Payment Sequence</th>
            </tr>
            {transactionInfoList
              .sort((a, b) => b.number - a.number)
              .map(transactionInfo => {
                return (
                  <tr key={transactionInfo.hash}>
                    <td>{transactionInfo.type}</td>
                    <td><Link to={`/txs/${transactionInfo.hash}`}>{transactionInfo.hash}</Link></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  }
}
