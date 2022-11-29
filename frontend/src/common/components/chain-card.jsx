import React, { useState } from "react";
import { ChainList } from "common/constants";
import cx from 'classnames';
import config from "../../config";

const ChainCard = (props) => {
  const { chainInfo } = config;
  const [mainChain, setMainChain] = useState([chainInfo.mainchain]);
  const [subChain, setSubChain] = useState(chainInfo.subchains);

  const handleOnChange = (e) => {
    const filter = e.target.value;
    setMainChain([chainInfo.mainchain].filter(o => o.name.toLowerCase().includes(filter.toLowerCase())));
    setSubChain(chainInfo.subchains.filter(o => o.name.toLowerCase().includes(filter.toLowerCase())));
  }

  console.log('isMainChain:', props.isMainChain);
  return <div className="chain-card-wrap" onClick={props.onClose}>
    <div className="chain-card-container">
      <div className={cx("chain-card", { 'right': !props.isMainChain })} onClick={e => e.stopPropagation()}>
        <div className="chain-card__search">
          <div className="search-wrap">
            <input type="text" className="search-input" placeholder="Filter Chains..." onChange={handleOnChange} />
            <div className="search-button" >
              <svg className="svg-icon" viewBox="0 0 20 20">
                <path fill="none" d="M19.129,18.164l-4.518-4.52c1.152-1.373,1.852-3.143,1.852-5.077c0-4.361-3.535-7.896-7.896-7.896
								c-4.361,0-7.896,3.535-7.896,7.896s3.535,7.896,7.896,7.896c1.934,0,3.705-0.698,5.078-1.853l4.52,4.519
								c0.266,0.268,0.699,0.268,0.965,0C19.396,18.863,19.396,18.431,19.129,18.164z M8.567,15.028c-3.568,0-6.461-2.893-6.461-6.461
                s2.893-6.461,6.461-6.461c3.568,0,6.46,2.893,6.46,6.461S12.135,15.028,8.567,15.028z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="chain-card__content">
          <div className="chain-card__chain-list">
            <div className="chain-card__chain-list--name">Main Chain</div>
            <div className="chain-card__chains">
              {mainChain.length === 0 ? <div className="chain-card__chain">
                No Result
              </div> : mainChain.map((chain, i) => {
                return <a className="chain-card__chain" key={i} href={chain.host}>
                  <div className={`chain-logo-brief ${chain.logoName}`}></div>
                  <div className="chain-name">{chain.name}</div>
                </a>
              })}
            </div>
          </div>
          <div className="chain-card__chain-list">
            <div className="chain-card__chain-list--name">Subchains</div>
            <div className="chain-card__chains">
              {subChain.length === 0 ? <div className="chain-card__chain">
                No Result
              </div> : subChain.map((chain, i) => {
                console.log('chain:', chain);
                return <a className="chain-card__chain" key={i} href={chain.host}>
                  <div className={`chain-logo-brief ${chain.logoName}`}></div>
                  <div className="chain-name">{chain.name}</div>
                </a>
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default React.memo(ChainCard);