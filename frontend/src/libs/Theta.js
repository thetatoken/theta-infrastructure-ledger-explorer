import { BigNumber } from 'bignumber.js';
import ThetaJS from './thetajs.esm';
import Config from '../config';

export default class Theta {
  static _chainId = Config.defaultThetaChainID;

  static get chainId() {
    return this._chainId;
  }

  static getTransactionFee() {
    //10^12 TFuelWei
    return 0.000001;
  }

  static unsignedSmartContractTx(txData, sequence) {
    let { from, to, data, value, transactionFee, gasLimit } = txData;

    const ten18 = (new BigNumber(10)).pow(18); // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei
    const feeInTFuelWei = (new BigNumber(transactionFee)).multipliedBy(ten18); // Any fee >= 10^12 TFuelWei should work, higher fee yields higher priority
    const senderSequence = sequence;
    const gasPrice = feeInTFuelWei;

    let tx = new ThetaJS.SmartContractTx(from, to, gasLimit, gasPrice, data, value, senderSequence);

    return tx;
  }
}
