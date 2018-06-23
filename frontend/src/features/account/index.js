import React, { Component } from "react";
import { browserHistory } from 'react-router';
import AccountExplorerTable from './components/account-explorer-table';
import { accountService } from '/common/services/account';
import NotExist from 'common/components/not-exist';
// import './styles.scss';

export default class AccountExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.route.backendAddress,
      // backendAddress: "localhost:9000",
      accountInfo: null,
      errorType: null
    };
  }
  componentWillUpdate(nextProps) {
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
      accountService.getOneAccountByAddress(address.toUpperCase())
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
      errorType === 'error_not_found' ? <NotExist msg="Note: An account will not be created until the first time it receives some tokens."/> :
        <div>
          {accountInfo !== null ?
            <AccountExplorerTable accountInfo={accountInfo} /> : <div></div>}
        </div>
    )
  }
  render() {
    const { accountAddress } = this.props.params;
    return (
      <div className="th-explorer">
        <div className="th-explorer__title">
          <span>Account Detail: {accountAddress.toUpperCase()}</span>
        </div>
        {this.renderContent()}
      </div>
    );
  }
}