import React from "react";
import { getPrice } from "../helpers/utils";

const DAppCard = (props) => {
  const { info } = props;
  return <div className="dapp-card">
    <div className="dapp-card__header">
      <div className={`dapp-card__logo ${info.name}`}>
        {info.team ? info.name : ""}
      </div>
    </div>
    <div className="dapp-card__content">
      {info.price && <div className="dapp-card__price">{getPrice(info.price, 4)}</div>}
      {info.market_cap && <div className="dapp-card__info">
        <div className="dapp-card__info--title">MARKET CAP</div>
        <div className="dapp-card__info--value">{getPrice(info.market_cap, 0)}</div>
      </div>}
      {info.volume && <div className="dapp-card__info">
        <div className="dapp-card__info--title">24 HR VOLUME</div>
        <div className="dapp-card__info--value">{getPrice(info.volume, 0)}</div>
      </div>}
      {info.nft_volume && <div className="dapp-card__info mid">
        <div className="dapp-card__info--title">DAILY NFT VOLUME</div>
        <div className="dapp-card__info--value large">{info.nft_volume}</div>
      </div>}
      {info.team && <div className="dapp-card__team">
        <div className="dapp-card__team--text">BY</div>
        <div className={`dapp-card__team--logo ${info.team}`}></div>
      </div>}
      {info.description && <div className="dapp-card__description">{info.description}</div>}
    </div>
    <a className="dapp-card__footer" href={info.link} target="_blank" rel="noreferrer">LEARN MORE</a>
  </div>
}

export default React.memo(DAppCard);