import React, { useEffect, useState } from "react";
import get from 'lodash/get';
import config from "../../config";

const SubchainAbout = ({ }) => {

  return <div className="subchain-about">
    <div className="subchain-about__info">
      <div className="subchain-about__info--title">
        About {getSubchainName(config.chainName)}
      </div>
      <div className="subchain-about__info--logo">
        <div className={`chain-logo ${config.logoName}`}></div>
      </div>
      <div className="subchain-about__info--description">
        {config.chainDescription}
      </div>
    </div>
    <div className="subchain-about__links">
      <div className="subchain-about__links--websites">
        {config.links.website && <a className="subchain-about__links--link" href={config.links.website} target="_blank" rel="noreferrer">
          <div className="subchain-about__links--icon website"></div>
          {config.links.website}
        </a>}
        {config.links.cmc && <a className="subchain-about__links--link" href={config.links.cmc} target="_blank" rel="noreferrer">
          <div className="subchain-about__links--icon cmc"></div>
          Coinmarketcap.com
        </a>}
        {config.links.whitePaper && <a className="subchain-about__links--link" href={config.links.whitePaper} target="_blank" rel="noreferrer">
          <div className="subchain-about__links--icon whitepaper"></div>
          Whitepaper
        </a>}
        {config.links.ck && <a className="subchain-about__links--link" href={config.links.ck} target="_blank" rel="noreferrer">
          <div className="subchain-about__links--icon ck"></div>
          Coingecko.com
        </a>}
      </div>
      <div className="subchain-about__sm">
        <div className="subchain-about__sm--title">
          SOCIAL MEDIA
        </div>
        <div className="subchain-about__sm--wrap">
          {config.links.tg && <a className="subchain-about__sm--link" href={config.links.tg} target="_blank" rel="noreferrer">
            <div className="subchain-about__links--icon tg"></div>
          </a>}
          {config.links.twitter && <a className="subchain-about__sm--link" href={config.links.twitter} target="_blank" rel="noreferrer">
            <div className="subchain-about__links--icon twitter"></div>
          </a>}
          {config.links.discord && <a className="subchain-about__sm--link" href={config.links.discord} target="_blank" rel="noreferrer">
            <div className="subchain-about__links--icon discord"></div>
          </a>}
          {config.links.medium && <a className="subchain-about__sm--link" href={config.links.medium} target="_blank" rel="noreferrer">
            <div className="subchain-about__links--icon medium"></div>
          </a>}
        </div>
      </div>
    </div>
  </div>
}

function getSubchainName(name) {
  const subchainIndex = name.indexOf(' subchain');
  if (subchainIndex !== -1) {
    return name.substring(0, subchainIndex);
  } else {
    return name;
  }
}
export default SubchainAbout;