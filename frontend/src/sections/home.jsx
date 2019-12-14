import React, { Component } from "react";
import { Link } from 'react-router';

import TransactionsTable from "common/components/transactions-table";
import BlocksTable from "common/components/blocks-table";
import TokenDashboard from "common/components/token-dashboard";
import { priceService } from 'common/services/price';

export default class Dashboard extends Component {
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
  getPrices() {
    priceService.getAllprices()
      .then(res => {
        const prices = _.get(res, 'data.body');
        prices.forEach(info => {
          switch (info._id) {
            case 'THETA':
                this.setState({ thetaInfo: info })
              return;
            case 'TFUEL':
                this.setState({ tfuelInfo: info })
              return;
            default:
              return;
          }
        })
      })
      .catch(err => {
        console.log(err);
      });
    setTimeout(() => {
      let { thetaInfo, tfuelInfo } = this.state;
      if (!thetaInfo || !tfuelInfo) {
        this.getPrices();
      }
    }, 2000);
  }
  render() {
    const { thetaInfo, tfuelInfo } = this.state;
    const { backendAddress } = this.props.route;
    return (
      <div className="content home">
        <TokenDashboard type='theta' tokenInfo={thetaInfo} />
        <TokenDashboard type='tfuel' tokenInfo={tfuelInfo} />
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