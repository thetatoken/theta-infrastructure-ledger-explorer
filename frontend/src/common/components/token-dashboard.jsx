import React, { Component } from "react";
import _ from 'lodash';
import cx from 'classnames';

import { formatNumber, formatCurrency } from 'common/helpers/utils';
import { transactionsService } from 'common/services/transaction';

import { hash } from 'common/helpers/transactions';
import { TxnTypeText, TxnClasses } from 'common/constants';

export default class TokenDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      txnNum: 0
    };
  }
  componentDidMount() {
    if (this.props.type === 'theta') {
      this.getTransactionNumber();
    }
  }
  getTransactionNumber() {
    transactionsService.getTotalTransactionNumber()
      .then(res => {
        const txnNum = _.get(res, 'data.body.total_num_tx');
        this.setState({ txnNum })
      })
      .catch(err => {
        console.log(err);
      });
  }
  render() {
    const { txnNum } = this.state;
    const { tokenInfo, type } = this.props;
    const icon = type + 'wei';
    const token = type.toUpperCase();
    console.log(txnNum)
    return (
      <React.Fragment>
        {tokenInfo && <div className={cx("token dashboard", type)}>
          <div className="column">
            <div className={cx("currency", icon)}></div>
          </div>
          <div className="column">
            <Detail title={`${token} Price (USD)`} value={`\$${tokenInfo.price.toFixed(6)}`} />
            <Detail title={'MARKET CAP (USD)'} value={formatCurrency(tokenInfo.market_cap)} />
          </div>
          <div className="column">
            <Detail title={'24 HR VOLUME (USD)'} value={formatCurrency(tokenInfo.volume_24h)} />
            <Detail title={'SUPPLY'} value={formatNumber(tokenInfo.circulating_supply)} />
          </div>
          <div className="column">
            {type === 'theta' && <Detail title={'TRANSACTIONS'} value={<TxnNumber num={txnNum} />} />}
            {/* {type === 'theta' && <Detail title={'TRANSACTIONS'} value={txnNum} />} */}
            {type === 'theta' && <Detail title={'total STAKED (%)'} value={`N/A`} />}
          </div>
          <div className="column">
            {type === 'theta' ?
              <div className="chart-container">
                <div className="title">THETA BLOCKCHAIN TRANSACTION HISTORY (14 DAYS)</div>
                <div className="chart"></div>
              </div> :
              <div className="chart-container">
                <div className="title">THETA NODES</div>
                <div className="chart"></div>
              </div>}
          </div>
        </div>}
      </React.Fragment>
    );
  }
}

const Detail = ({ title, value }) => {
  return (
    <div className="detail">
      <div className="title">{title}</div>
      <div className={cx("value", { price: title.includes('Price') })}>{value}</div>
    </div>
  );
}

const TxnNumber = ({ num }) => {
  const duration = (new Date() - new Date('2019-03-15T20:00:00').getTime()) / 1000;
  const tps = num / duration.toFixed();
  console.log(tps)
  // return formatNumber(num / 1000000) + ' M';
  return (
    <React.Fragment>
      {`${formatNumber(num / 1000000) + ' M'}`}
      <div className="tps">[{tps.toFixed()} TPS]</div>
    </React.Fragment>
  );
}