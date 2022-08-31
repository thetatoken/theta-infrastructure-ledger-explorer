import React from "react";
import { Link } from 'react-router-dom';
import get from 'lodash/get';

import TransactionsTable from "common/components/transactions-table";
import BlocksTable from "common/components/blocks-table";
import TokenDashboard from "common/components/token-dashboard";
import DashboardRow from "common/components/dashboard-row";
import { priceService } from 'common/services/price';
import DappCard from "../common/components/dapp-card";

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
              <Link className="chain-overview__chain" to="/">
                <div className="chain-overview__chain--logo">
                  <div className="chain-logo theta"></div>
                </div>
                <div className="chain-overview__chain--description">
                  One sentence description of the Theta Main Chain
                </div>
              </Link>
            </div>
          </div>
          <div className="chain-overview">
            <div className="chain-overview__title">SUBCHAINS</div>
            <div className="chain-overview__chains">
              <Link className="chain-overview__chain" to="/">
                <div className="chain-overview__chain--logo">
                  <div className="chain-logo replay"></div>
                </div>
                <div className="chain-overview__chain--description">
                  One sentence description of subchain #1
                </div>
              </Link>
              <Link className="chain-overview__chain" to="/">
                <div className="chain-overview__chain--logo">
                  <div className="chain-logo replay"></div>
                </div>
                <div className="chain-overview__chain--description">
                  One sentence description of subchain #2
                </div>
              </Link>
            </div>
          </div>
        </> : <>
          <div className="dapps">
            <div className="dapps__title">
              DAPPS ON THETA MAIN CHAIN
            </div>
            <div className="dapps__container">
              <DappCard info={{ name: 'tdrop', price: '0.0079', market_cap: '79776454', volume: '345978' }} />
              <DappCard info={{ name: 'replay', price: '0.0079', market_cap: '79776454', volume: '345978' }} />
              <DappCard info={{ name: 'voltswap', price: '0.0079', market_cap: '79776454', volume: '345978' }} />
              <DappCard info={{ name: 'pentheta', nft_volume: '2,403' }} />
              <DappCard info={{ name: 'tns', team: 'thetaboard', description: "Lorem ipsum dolor sit amet consectetuer adipiscing." }} />
            </div>
            <div className="dapps__footer">
              <Link to="/" className="more">View More</Link>
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