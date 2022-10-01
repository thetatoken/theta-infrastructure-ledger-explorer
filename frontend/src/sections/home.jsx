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
import config from '../config';
import { ChainType } from "../common/constants";

export default class Dashboard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      thetaInfo: null,
      tfuelInfo: null,
      tdropInfo: null
    };
  }
  componentDidMount() {
    this.getPrices();
  }
  getPrices(counter = 0) {
    priceService.getAllprices()
      .then(async res => {
        const prices = get(res, 'data.body');
        let thetaInfo, tfuelInfo, tdropInfo;
        prices.forEach(info => {
          if (info._id === 'THETA') thetaInfo = info;
          else if (info._id === 'TFUEL') tfuelInfo = info;
          else if (info._id === 'TDROP') tdropInfo = info;
        })
        try {
          let res = await priceService.getTfuelSupply();
          tfuelInfo.circulating_supply = get(res, 'data.circulation_supply')
          this.setState({ thetaInfo, tfuelInfo, tdropInfo })
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
    const { thetaInfo, tfuelInfo, tdropInfo } = this.state;
    const { backendAddress, type } = this.props;
    const { chainInfo } = config;

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
              <a className="chain-overview__chain" href={chainInfo.mainchain.host}>
                <div className="chain-overview__chain--logo">
                  <div className={`chain-logo ${chainInfo.mainchain.logoName}`}></div>
                </div>
                <div className="chain-overview__chain--description">
                  {chainInfo.mainchain.description}
                </div>
              </a>
            </div>
          </div>
          <div className="chain-overview">
            <div className="chain-overview__title">SUBCHAINS</div>
            <div className="chain-overview__chains">
              {chainInfo.subchains.map((chain, i) => {
                return <a className="chain-overview__chain" href={chain.host} key={i}>
                  <div className="chain-overview__chain--logo">
                    <div className={`chain-logo ${chain.logoName}`}></div>
                  </div>
                  <div className="chain-overview__chain--description">
                    {chain.description}
                  </div>
                </a>
              })}
            </div>
          </div>
        </> : <>
          {config.chainType !== ChainType.SUBCHAIN && <div className="dapps">
            <div className="dapps__title">
              DAPPS ON {config.chainName || 'THETA TESTNET MAIN CHAIN'}
            </div>
            <div className="dapps__container">
              <DappCard info={{ name: 'tdrop', price: (get(tdropInfo, 'price') || 0).toFixed(4) || '0.0052', market_cap: (get(tdropInfo, 'market_cap') || 0).toFixed(0), volume: (get(tdropInfo, 'volume_24h') || 0).toFixed(0), link: "https://www.thetadrop.com/" }} />
              <DappCard info={{ name: 'voltswap', description: "VoltSwap is a community-driven DEX on the Theta Blockchain, which allows users to swap a variety of tokens, earn APY, and maximize yields.", link: "https://v1.voltswap.finance/" }} />
              <DappCard info={{ name: 'pentheta', description: 'OpenTheta is an independent NFT marketplace on the Theta blockchain to discover and collect digital assets.', link: "https://opentheta.io/" }} />
              <DappCard info={{ name: 'metapass', description: "Metapass allows you to create events and sell NFT tickets on Theta. True event ticket ownership secured by the Theta blockchain.", link: "https://www.metapass.world/" }} />
              <DappCard info={{ name: 'tns', team: 'thetaboard', description: "Theta Name Service (TNS) is a distributed, open, and extensible naming system based on the Theta blockchain.", link: "https://thetaboard.io/" }} />
            </div>
            <div className="dapps__footer">
              <a href="https://www.thetatoken.org/ecosystem" target="_blank" rel="noreferrer" className="more">View More</a>
            </div>
          </div>}
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