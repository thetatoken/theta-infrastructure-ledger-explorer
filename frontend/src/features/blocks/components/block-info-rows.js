import React, { Component } from "react";
import { Link } from "react-router";
// import '../styles.scss';

export default class BlockInfoRows extends Component {
    render() {
      const { blockInfoList } = this.props;
  
      return (
        <div>
          <table className="tableContainer" cellSpacing="10px" >
            <tbody>
              <tr>
                <th>Creation Timestamp</th>
                <th>Block Height</th>
                <th>Block Hash</th>
                <th>Number of Transactions</th>
                <th>Parent Hash</th>
                <th>Data Hash</th>
              </tr>
              {blockInfoList
                .sort((a, b) => b.height - a.height)
                .map(blockInfo => {
                  return (
                    <tr key={blockInfo.height}>
                      <td>{blockInfo.timestamp}</td>
                      <td>{blockInfo.height}</td>
                      <td><Link to={`/blocks/${blockInfo.height}`}>{blockInfo.hash}</Link></td>
                      <td>{blockInfo.num_txs}</td>
                      <td>{blockInfo.parent_hash}</td>
                      <td>{blockInfo.data_hash}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      );
    }
  }
  