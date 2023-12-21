import React, { useEffect, useState } from "react";
import get from 'lodash/get';
import config from "../../config";

const SubchainAbout = ({ }) => {


  return <div className="subchain-about">
    <div className="subchain-about__info">
      <div className="subchain-about__info--title">
        About {config.chainName}
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
        <a className="subchain-about__links--link" href={config.links.website} target="_blank" rel="noreferrer">
          <div className="subchain-about__links--icon website"></div>
          {config.links.website}
        </a>
        <a className="subchain-about__links--link" href={config.links.cmc} target="_blank" rel="noreferrer">
          <div className="subchain-about__links--icon cmc"></div>
          Coinmarketcap.com
        </a>
        <a className="subchain-about__links--link" href={config.links.whitePaper} target="_blank" rel="noreferrer">
          <div className="subchain-about__links--icon whitepaper"></div>
          Whitepaper
        </a>
        <a className="subchain-about__links--link" href={config.links.ck} target="_blank" rel="noreferrer">
          <div className="subchain-about__links--icon ck"></div>
          Coingecko.com
        </a>
      </div>
      <div className="subchain-about__sm">
        <div className="subchain-about__sm--title">
          SOCIAL MEDIA
        </div>
        <div className="subchain-about__sm--wrap">
          <a className="subchain-about__sm--link" href={config.links.tg} target="_blank" rel="noreferrer">
            <div className="subchain-about__links--icon tg"></div>
          </a>
          <a className="subchain-about__sm--link" href={config.links.twitter} target="_blank" rel="noreferrer">
            <div className="subchain-about__links--icon twitter"></div>
          </a>
          <a className="subchain-about__sm--link" href={config.links.discord} target="_blank" rel="noreferrer">
            <div className="subchain-about__links--icon discord"></div>
          </a>
          <a className="subchain-about__sm--link" href={config.links.medium} target="_blank" rel="noreferrer">
            <div className="subchain-about__links--icon medium"></div>
          </a>
        </div>
      </div>
    </div>
  </div>
}

export default SubchainAbout;