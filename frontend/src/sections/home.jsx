import React, { Component } from "react";
import { Link } from 'react-router';

import TransactionsTable from "common/components/transactions-table";
import BlocksTable from "common/components/blocks-table";

export default class Dashboard extends Component {
  render() {
    const { backendAddress } = this.props.route;
    return (
      <div className="content home">
        <div className="overview">
          <div>
            <h2 className="page-title blocks"><Link to="/blocks">Blocks</Link></h2>
            <BlocksTable 
              updateLive={true} 
              backendAddress={ backendAddress } 
              truncateHash={true}
              includeDetails={false}
              truncate={50} />
            <Link to="/blocks" className="more">View More</Link>
          </div>

          <div>
            <h2 className="page-title transactions"><Link to="/txs">Transactions</Link></h2>
            <TransactionsTable 
              updateLive={true} 
              backendAddress={ backendAddress }
              includeDetails={false}
              truncate={40} />
            <Link to="/txs" className="more">View More</Link>
          </div>
          
        </div>
      </div>
    );
  }
}