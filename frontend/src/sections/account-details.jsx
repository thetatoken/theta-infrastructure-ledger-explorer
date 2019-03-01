import React, { Component } from "react";
import { Link, browserHistory } from 'react-router';
import cx from 'classnames';
import BigNumber from 'bignumber.js';


import { formatCoin } from 'common/helpers/utils';
import { CurrencyLabels } from 'common/constants';
import AccountExplorerTable from './account/components/account-explorer-table';
import { accountService } from 'common/services/account';
import NotExist from 'common/components/not-exist';
import DetailsRow from 'common/components/details-row';


export default class AccountDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.route.backendAddress,
      account: null,
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
    this.getOneAccountByAddress(accountAddress);
  }

  getOneAccountByAddress(address) {
    if (address) {
      accountService.getOneAccountByAddress(address.toUpperCase())
        .then(res => {
          switch (res.data.type) {
            case 'account':
              this.setState({
                account: res.data.body,
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
  render() {
    const { accountAddress } = this.props.params;
    const { account, errorType } = this.state;
    return (
      <div className="content account">
        <div className="page-title account">Account Detail</div>
        { errorType === 'error_not_found' && 
        <NotExist msg="Note: An account will not be created until the first time it receives some tokens."/>}
        { account && !errorType && 
        <React.Fragment>
          <table className="details account-info">
            <thead>
              <tr>
                <th>Address</th>
                <th>{account.address}</th>
              </tr>
            </thead>
            <tbody>
              <DetailsRow label="Balance" data={ <Balance balance={account.balance} /> } />
              <DetailsRow label="Sequence" data={ account.sequence } />
            </tbody>
          </table>
          <table className="details account-txns">
            <tbody>
              <DetailsRow label="Recent Transactions" data={ <HashList hashes={account.txs_hash_list} /> } />
            </tbody>
          </table>
        </React.Fragment>}
      </div>
    );
  }
}

const Balance = ({ balance }) => {
  return (
    <React.Fragment>
     { _.map(balance, (v,k) => <div key={k} className={cx("currency", k)}>{`${formatCoin(v)} ${CurrencyLabels[k] || k}` }</div>) }
    </React.Fragment>)
}

const Address = ({ hash }) => {
  return(<a href={`/account/${hash}`} target="_blank">{ hash }</a>)
}

const HashList = ({hashes}) => {
  return (
    <React.Fragment>
      {_.map(_.compact(hashes), (hash,i) => <div key={i}><Link key={hash} to={`/txs/${hash.toLowerCase()}`}>{hash.toLowerCase()}</Link></div>)}
    </React.Fragment>
  )
}

