import React from "react";
import { Link } from 'react-router-dom';
import get from 'lodash/get';

import TransactionsTable from "common/components/transactions-table";
import BlocksTable from "common/components/blocks-table";
import TokenDashboard from "common/components/token-dashboard";
import DashboardRow from "common/components/dashboard-row";
import { priceService } from 'common/services/price';
import DappCard from "../common/components/dapp-card";
import { ChainList } from 'common/constants';

export default class Dashboard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      thetaInfo: null,
      tfuelInfo: null
    };
  }
  componentDidMount() {
    this.getPrices();
  }
  getPrices(counter = 0) {
    priceService.getAllprices()
      .then(async res => {
        const prices = get(res, 'data.body');
        let thetaInfo, tfuelInfo;
        prices.forEach(info => {
          if (info._id === 'THETA') thetaInfo = info;
          else if (info._id === 'TFUEL') tfuelInfo = info;
        })
        try {
          let res = await priceService.getTfuelSupply();
          tfuelInfo.circulating_supply = get(res, 'data.circulation_supply')
          this.setState({ thetaInfo, tfuelInfo })
        } catch (err) {
          console.log(err);
        }
      })
      .catch(err => {
        console.log(err);
      });
    setTimeout(() => {
      let { thetaInfo, tfuelInfo } = this.state;
      if ((!thetaInfo || !tfuelInfo) && counter++ < 4) {
        this.getPrices(counter);
      }
    }, 1000);
  }
  render() {
    const { thetaInfo, tfuelInfo } = this.state;
    const { backendAddress, type } = this.props;

    return (
      <div className="content home">
        <div className="dashboard-wrap">
          <TokenDashboard type='theta' tokenInfo={thetaInfo} />
          <TokenDashboard type='tfuel' tokenInfo={tfuelInfo} />
          <DashboardRow />
        </div>
        {type === 'metachain' ? <>
          <div className="chain-overview">
            <div className="chain-overview__title"> MAIN CHAIN</div>
            <div className="chain-overview__chains">
              {ChainList.mainChain.map((chain, i) => {
                return <Link className="chain-overview__chain" to="/" key={i}>
                  <div className="chain-overview__chain--logo">
                    <div className={`chain-logo ${chain.logoName}`}></div>
                  </div>
                  <div className="chain-overview__chain--description">
                    {chain.description}
                  </div>
                </Link>
              })}
            </div>
          </div>
          <div className="chain-overview">
            <div className="chain-overview__title">SUBCHAINS</div>
            <div className="chain-overview__chains">
              {ChainList.subChain.map((chain, i) => {
                return <Link className="chain-overview__chain" to="/" key={i}>
                  <div className="chain-overview__chain--logo">
                    <div className={`chain-logo ${chain.logoName}`}></div>
                  </div>
                  <div className="chain-overview__chain--description">
                    {chain.description}
                  </div>
                </Link>
              })}
            </div>
          </div>
        </> : <>
          <div className="dapps">
            <div className="dapps__title">
              DAPPS ON THETA MAIN CHAIN
            </div>
            <div className="dapps__container">
              <DappCard info={{ name: 'tdrop', price: '0.0079', market_cap: '79776454', volume: '345978', link: "https://www.thetadrop.com/" }} />
              <DappCard info={{ name: 'replay', price: '0.0079', market_cap: '79776454', volume: '345978', link: "https://imaginereplay.com/" }} />
              <DappCard info={{ name: 'voltswap', price: '0.0079', market_cap: '79776454', volume: '345978', link: "https://info.voltswap.finance/#/home?network=theta/" }} />
              <DappCard info={{ name: 'pentheta', nft_volume: '2,403', link: "https://opentheta.io/" }} />
              <DappCard info={{ name: 'tns', team: 'thetaboard', description: "Lorem ipsum dolor sit amet consectetuer adipiscing.", link: "https://thetaboard.io/" }} />
            </div>
            <div className="dapps__footer">
              <a href="https://www.thetatoken.org/ecosystem" target="_blank" rel="noreferrer" className="more">View More</a>
            </div>
          </div>
          <div className="overview">
            <div>
              <h2 className="page-title blocks"><Link to="/blocks">Blocks</Link></h2>
              <BlocksTable
                updateLive={true}
                backendAddress={backendAddress}
                truncateHash={true}
                includeDetails={false}
                truncate={50} />
              <Link to="/blocks" className="more">View More</Link>
            </div>
            <div>
              <h2 className="page-title transactions"><Link to="/txs">Transactions</Link></h2>
              <TransactionsTable
                updateLive={true}
                backendAddress={backendAddress}
                includeDetails={false}
                truncate={40} />
              <Link to="/txs" className="more">View More</Link>
            </div>
          </div></>}
      </div>
    );
  }
}