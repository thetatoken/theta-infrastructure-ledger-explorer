import React, { Component } from "react";
import { Link } from "react-router"
// import '../styles.scss';

export default class BlockInfoRows extends Component {
    render() {
      const { blockInfoList } = this.props;
      // var blocks = [].concat(blockInfoList)
      //   .sort((a,b) => a.height > b.height)
      //   .map((blockInfo) => {
      //   return (
      //     <React.Fragment key={blockInfo.height}>
      //       <p>{blockInfo.height}  {blockInfo.hash}.  {blockInfo.timestamp}</p>
      //     </React.Fragment>
      //   );
      // });  <p>Height        Hash        Timestamp</p>
  
      return (
        <div>
          <table className="tableContainer" cellSpacing="10px" >
            <tbody>
              <tr>
                <th width='300'>Creation Timestamp</th>
                <th width='200'>Block Height</th>
                <th width='300'>Block Hash</th>
                <th width='300'>Number of Transactions</th>
                <th width='300'>Parent Hash</th>
                <th width='300'>Data Hash</th>
              </tr>
              {blockInfoList
                .sort((a, b) => b.height - a.height)
                .map(blockInfo => {
                  return (
                    <tr key={blockInfo.height}>
                      <td width='300'>{blockInfo.timestamp}</td>
                      <td width='200'>{blockInfo.height}</td>
                      <td width='300'><Link to={`/blocks/${blockInfo.height}`}>{blockInfo.hash}</Link></td>
                      <td width='300'>{blockInfo.num_txs}</td>
                      <td width='300'>{blockInfo.parent_hash}</td>
                      <td width='300'>{blockInfo.data_hash}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      );
    }
  }
  