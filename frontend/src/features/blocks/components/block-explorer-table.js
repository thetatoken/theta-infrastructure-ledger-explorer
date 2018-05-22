import React, { Component } from "react";
import { Link } from "react-router"
import '../styles.scss';

export default class BlockExplorerTable extends Component {
  renderContent(key, content){
    // if(key === 'hash'){
    //   return(
    //     <Link to="">{content}</Link>
    //   )
    // }else 
      return content;
  }
  render() {
    const { blockInfo } = this.props;
    return (
      <div className="th-be-table">
        {Object.keys(blockInfo).map(key => {
          const content = key === 'txs' ? blockInfo[key][0].outputs[0].address : blockInfo[key];
          return (
            <div className="th-be-table__row" key={key}>
              <div className="th-be-table__row--left">{key}</div>
              <div className="th-be-table__row--right">
                {this.renderContent(key, content)}
              </div>
            </div>
          )
        })}
      </div>
    );
  }
}
