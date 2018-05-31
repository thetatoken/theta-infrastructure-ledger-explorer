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
              <th>Transaction Payment Sequence</th>
            </tr>
            {transactionInfoList
              .sort((a, b) => b.uuid - a.uuid)
              .map(transactionInfo => {
                return (
                  <tr key={transactionInfo.uuid}>
                    <td><Link to={`/txs/${transactionInfo.uuid}`}>{transactionInfo.pmt_sqnc}</Link></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  }
}
