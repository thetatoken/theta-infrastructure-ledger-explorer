import React, { Component } from "react";
import { browserHistory } from 'react-router';
import UserExplorerTable from './components/user-explorer-table';
import { userService } from '/common/services/user';
import { Link } from "react-router";
import NotExist from 'common/components/not-exist';
// import './styles.scss';

export default class TransactionExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      // backendAddress: "52.53.243.120:9000",
      backendAddress: "localhost:9000",
      userInfo: null,
      errorType: null
    };
  }
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.params.userAddress !== this.props.params.userAddress) {
      this.getOneUserByAddress(nextProps.params.userAddress);
    }
  }
  componentDidMount() {
    const { userAddress } = this.props.params;
    browserHistory.push(`/user/${userAddress}`);
    this.getOneUserByAddress(userAddress);
  }

  getOneUserByAddress(address) {
    if (address) {
      userService.getOneUserByAddress(address)
        .then(res => {
            console.log(res)
          switch (res.data.type) {
            case 'user':
              this.setState({
                userInfo: res.data.body,
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
    const { userInfo, errorType } = this.state;
    return (
      errorType === 'error_not_found' ? <NotExist /> :
        <div>
          {userInfo !== null ?
            <UserExplorerTable userInfo={userInfo} /> : <div></div>}
        </div>
    )
  }
  render() {
    const { userInfo } = this.state;
    const address = userInfo ? userInfo.address : null;
    return (
      <div className="th-transaction-explorer">
        <div className="th-block-explorer__title">
          <span>User Detail: {address}</span>
        </div>
        {this.renderContent()}
      </div>
    );
  }
}