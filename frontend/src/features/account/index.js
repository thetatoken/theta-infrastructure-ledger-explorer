import React, { Component } from "react";
import { browserHistory } from 'react-router';
import AccountExplorerTable from './components/account-explorer-table';
import { accountService } from '/common/services/account';
import { Link } from "react-router";
import NotExist from 'common/components/not-exist';
// import './styles.scss';

export default class AccountExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      // backendAddress: "52.53.243.120:9000",
      backendAddress: "localhost:9000",
      accountInfo: null,
      errorType: null
    };
  }
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.params.accountAddress !== this.props.params.accountAddress) {
      this.getOneAccountByAddress(nextProps.params.accountAddress);
    }
  }
  componentDidMount() {
    const { accountAddress } = this.props.params;
    browserHistory.push(`/account/${accountAddress}`);
    this.getOneAccountByAddress(accountAddress);
  }

  getOneAccountByAddress(address) {
    if (address) {
      accountService.getOneAccountByAddress(address)
        .then(res => {
          switch (res.data.type) {
            case 'account':
              this.setState({
                accountInfo: res.data.body,
                errorType: null
              })
              break;
            case 'error_not_found':
              this.setState({
                errorType: 'error_not_found'
              });
              break;
            default:
              break;
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
    const { accountInfo, errorType } = this.state;
    return (
      errorType === 'error_not_found' ? <NotExist /> :
        <div>
          {accountInfo !== null ?
            <AccountExplorerTable accountInfo={accountInfo} /> : <div></div>}
        </div>
    )
  }
  render() {
    const { accountInfo } = this.state;
    const { accountAddress } = this.props.params;
    return (
      <div className="th-transaction-explorer">
        <div className="th-block-explorer__title">
          <span>Account Detail: {accountAddress}</span>
        </div>
        {this.renderContent()}
      </div>
    );
  }
}