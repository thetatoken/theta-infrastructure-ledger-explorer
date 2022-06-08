import React from 'react';

const Item = props => {
  const { item, handleHashScroll } = props;

  function handleOnLoad() {
    if (handleHashScroll) {
      handleHashScroll();
    }
  }

  return typeof item === 'object' ? (
    <div className="sc-item">
      <div className="sc-item__column">
        <img className="sc-item__image" src={item.image} onLoad={handleOnLoad}></img>
      </div>
      <div className="sc-item__column">
        {item.name && item.name.length > 0 &&
          <>
            <div className="sc-item__text">Name</div>
            <div className="sc-item__text name">{item.name}</div>
          </>}
        {item.description && item.description.length > 0 &&
          <>
            <div className="sc-item__text">Description</div>
            <div className="sc-item__text">{item.description}</div>
          </>
        }
      </div>
    </div>
  ) : <div className="sc-item text-danger">{item}</div>
}

export default Item;