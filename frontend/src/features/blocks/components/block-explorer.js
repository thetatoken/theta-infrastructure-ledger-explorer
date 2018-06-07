import React, { Component } from "react";
import { browserHistory } from 'react-router';
import socketClient from 'socket.io-client';
import BlockInfoRows from './block-info-rows';
import BlockExplorerTable from './block-explorer-table';
import { blocksService } from '/common/services/block';
import { Link } from "react-router"
import LinkButton from "common/components/link-button";
import NotExist from 'common/components/not-exist';

// import './styles.scss';

export default class BlocksExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // backendAddress: this.props.route.backendAddress,
      // backendAddress: "52.53.243.120:9000",
      backendAddress: "localhost:9000",
      blockInfo: null,
      totalBlocksNumber: undefined,
      errorType: null
    };
  }
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.params.blockHeight !== this.props.params.blockHeight) {
      this.gerOneBlockByHeight(nextProps.params.blockHeight);
    }
  }
  componentDidMount() {
    const { blockHeight } = this.props.params;
    browserHistory.push(`/blocks/${blockHeight}`);

    const { backendAddress } = this.state;
    this.gerOneBlockByHeight(blockHeight);
  }
  gerOneBlockByHeight(height) {
    const { totalBlocksNumber } = this.state;
    if (Number(height)
      && (totalBlocksNumber === undefined
        || totalBlocksNumber >= height
        || height > 0)) {
      blocksService.getBlockByHeight(height)
        .then(res => {
          // console.log(res.data.body.txs)
          switch (res.data.type) {
            case 'block':
              this.setState({
                blockInfo: res.data.body,
                totalBlocksNumber: res.data.totalBlocksNumber,
                errorType: null
              });
              break;
            case 'error_not_found':
              this.setState({
                errorType: 'error_not_found'
              });
          }
        }).catch(err => {
          console.log(err);
        })
    } else {
      this.setState({
        errorType: 'error_not_found'
      });
      console.log('Wrong Height')
    }
  }
  renderNoMoreMsg() {
    return (
      <div className="th-block-explorer__buttons--no-more">No More</div>
    )
  }
  renderContent() {
    const { blockInfo, totalBlocksNumber, errorType } = this.state;
    const height = Number(this.props.params.blockHeight);
    return (
      errorType === 'error_not_found' ? <NotExist /> :
        <div>
          <div className="th-block-explorer__buttons">
            {height > 1 ?
              <LinkButton className="th-block-explorer__buttons--prev" url={`/blocks/${height - 1}`} left>Prev</LinkButton>
              : this.renderNoMoreMsg()
            }
            {totalBlocksNumber > height ?
              <LinkButton className="th-block-explorer__buttons--next" url={`/blocks/${height + 1}`} right>Next</LinkButton>
              : this.renderNoMoreMsg()
            }
          </div>
          {
            blockInfo !== null ?
              <BlockExplorerTable blockInfo={blockInfo} /> : <div></div>
          }
        </div>
    )
  }
  render() {
    const height = Number(this.props.params.blockHeight);
    return (
      <div className="th-block-explorer">
        <div className="th-block-explorer__title">
          <span>Block Detail: {height}</span>
        </div>
        {this.renderContent()}
      </div>
    );
  }
}