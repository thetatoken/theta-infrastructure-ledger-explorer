import React, { Component } from "react";
import { Link } from "react-router";
// import '../styles.scss';

export default class TransactionOverviewTable extends Component {
  render() {
    const { transactionInfoList, size } = this.props;
    const className = size === 'full' ? "th-overview-table full" : "th-overview-table";
    return (
      <div className={className}>
        <table>
          <tbody>
            <tr>
              <th className="th-overview-th__left">Type</th>
              <th className="th-overview-th__right">Transaction Hash</th>
            </tr>
            {transactionInfoList
              .sort((a, b) => b.number - a.number)
              .map(transactionInfo => {
                const hash = size === 'full' ? transactionInfo.hash.toLowerCase() : transactionInfo.hash.toLowerCase().substring(0,35) + '...';
                return (
                  <tr key={transactionInfo.hash}>
                    <td>{transactionInfo.type}</td>
                    <td><Link to={`/txs/${transactionInfo.hash.toLowerCase()}`}>{hash}</Link></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  }
}
