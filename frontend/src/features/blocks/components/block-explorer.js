import React, { Component } from "react";
import { browserHistory } from 'react-router';
import BlockExplorerTable from './block-explorer-table';
import { blocksService } from '/common/services/block';
import LinkButton from "common/components/link-button";
import NotExist from 'common/components/not-exist';

// import './styles.scss';

export default class BlocksExplorer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backendAddress: this.props.route.backendAddress,
      // backendAddress: "localhost:9000",
      blockInfo: null,
      totalBlocksNumber: undefined,
      errorType: null
    };
  }
  componentWillUpdate(nextProps) {
    if (nextProps.params.blockHeight !== this.props.params.blockHeight) {
      this.getOneBlockByHeight(nextProps.params.blockHeight);
    }
  }
  componentDidMount() {
    const { blockHeight } = this.props.params;
    browserHistory.push(`/blocks/${blockHeight}`);
    this.getOneBlockByHeight(blockHeight);
  }
  getOneBlockByHeight(height) {
    const { totalBlocksNumber } = this.state;
    const msg = this.props.location.state;
    if (Number(height)
      && (totalBlocksNumber === undefined
        || totalBlocksNumber >= height
        || height > 0)) {
      blocksService.getBlockByHeight(height)
        .then(res => {
          switch (res.data.type) {
            case 'block':
              this.setState({
                blockInfo: res.data.body,
                totalBlocksNumber: res.data.totalBlocksNumber,
                errorType: null
              });
              break;
            case 'error_not_found':
              console.log(res)
              this.setState({
                errorType: msg ? 'error_coming_soon' : 'error_not_found'
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
      <div className="th-explorer__buttons--no-more">No More</div>
    )
  }
  renderContent() {
    const { blockInfo, totalBlocksNumber, errorType } = this.state;
    const height = Number(this.props.params.blockHeight);
    switch (errorType) {
      case 'error_not_found':
        return <NotExist />;
      case 'error_coming_soon':
        return <NotExist msg="This block information is coming soon." />
      default:
        return (
          <div>
            <div className="th-explorer__buttons">
              {height > 1 ?
                <LinkButton className="th-explorer__buttons--prev" url={`/blocks/${height - 1}`} left>Prev</LinkButton>
                : this.renderNoMoreMsg()
              }
              {totalBlocksNumber > height ?
                <LinkButton className="th-explorer__buttons--next" url={`/blocks/${height + 1}`} right>Next</LinkButton>
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
  }
  render() {
    const height = Number(this.props.params.blockHeight);

    return (
      <div className="th-explorer">
        <div className="th-explorer__title">
          <span>Block Detail: {height}</span>
        </div>
        {this.renderContent()}
      </div>
    );
  }
}