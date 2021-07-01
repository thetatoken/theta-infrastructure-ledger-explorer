import React from "react";
import { Link } from 'react-router-dom';
import get from 'lodash/get';

import TransactionsTable from "common/components/transactions-table";
import BlocksTable from "common/components/blocks-table";
import TokenDashboard from "common/components/token-dashboard";
import DashboardRow from "common/components/dashboard-row";
import { priceService } from 'common/services/price';

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
    const { backendAddress } = this.props;
    return (
      <div className="content home">
        <div className="dashboard-wrap">
          <TokenDashboard type='theta' tokenInfo={thetaInfo} />
          <TokenDashboard type='tfuel' tokenInfo={tfuelInfo} />
          <DashboardRow />
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

        </div>
      </div>
    );
  }
}