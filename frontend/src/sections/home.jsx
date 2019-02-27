import React, { Component } from "react";

import TransactionsTable from "common/components/transactions-table";
import BlocksTable from "common/components/blocks-table";

export default class Dashboard extends Component {
  render() {
    const { backendAddress } = this.props.route;
    return (
      <div className="content home">
        <div className="overview">

          <div>
            <h2 className="page-title blocks"><a href="/blocks">Blocks</a></h2>
            <BlocksTable 
              updateLive={true} 
              backendAddress={ backendAddress } 
              truncateHash={true}
              includeDetails={false}
              truncate={50} />
            <a href="/blocks" className="btn s">More</a>
          </div>

          <div>
            <h2 className="page-title transactions">Transactions</h2>
            <TransactionsTable 
              updateLive={true} 
              backendAddress={ backendAddress }
              includeDetails={false}
              truncate={40} />
            <a href="/txs" className="btn s">More</a>
          </div>
          
        </div>
      </div>
    );
  }
}