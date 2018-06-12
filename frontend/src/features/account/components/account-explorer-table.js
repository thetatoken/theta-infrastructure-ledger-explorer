import React, { Component } from "react";
// import '../styles.scss';

export default class AccountExplorerTable extends Component {
  renderOneRow(leftContent, rightContent) {
    return (
      <div className="th-be-table__row">
        <div className="th-be-table__row--left">
          <p className="th-be-table-text">{leftContent}</p>
        </div>
        <div className="th-be-table__row--right">
          <div className="th-be-table-text">
            {rightContent}
          </div>
        </div>
      </div>
    )
  }
  renderBalance(balance){
    let content = '';
    balance.forEach( coin => {
      content += coin.amount + ' ' + coin.denom + ', '; 
    });
    return content.substring(0, content.length - 2);;
  }
  render() {
    const { accountInfo } = this.props;
    return (
      <div className="th-be-table">
        {this.renderOneRow('Address', accountInfo.address)}
        {this.renderOneRow('Balance', this.renderBalance(accountInfo.balance))}
      </div>
    );
  }
}
