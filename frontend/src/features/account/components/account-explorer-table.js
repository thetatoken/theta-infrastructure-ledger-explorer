import React, { Component } from "react";
import { Link } from "react-router";

// import '../styles.scss';

export default class AccountExplorerTable extends Component {
  renderOneRow(leftContent, rightContent) {
    return (
      <div className="th-explorer-table__row">
        <div className="th-explorer-table__row--left">
          <p className="th-explorer-table-text">{leftContent}</p>
        </div>
        <div className="th-explorer-table__row--right">
          <div className="th-explorer-table-text">
            {rightContent}
          </div>
        </div>
      </div>
    )
  }
  renderBalance(balance) {
    let content = '';
    balance.forEach(coin => {
      let denom = coin.denom;
      let amount = coin.amount;
      if (denom.includes('Wei') && amount > 100000) {
        denom = denom.substring(0, denom.length - 3);
        amount /= 1000000;
      }
      content += amount + ' ' + denom + ', ';
    });
    return content.substring(0, content.length - 2);;
  }
  renderReservedFunds(funds) {
    // TODO: NEED TO REVISE LATER
    return funds === "null" ? 'null' : 'Such a complex object';
  }
  renderToBlock(height) {
    const newTo = { 
      pathname: `/blocks/${height}`, 
      state: 'Coming Soon'
    };
    return (<Link to={newTo}>{height}</Link>)
  }
  render() {
    const { accountInfo } = this.props;
    // console.log(accountInfo)
    return (
      <div className="th-explorer-table">
        {this.renderOneRow('Address', accountInfo.address)}
        {this.renderOneRow('Sequence', accountInfo.sequence)}
        {/* {this.renderOneRow('Reserved Funds', this.renderReservedFunds(accountInfo.reserved_funds))} */}
        {this.renderOneRow('Last Updated Block Height', this.renderToBlock(accountInfo.last_updated_block_height))}
        {this.renderOneRow('Balance', this.renderBalance(accountInfo.balance))}
      </div>
    );
  }
}
