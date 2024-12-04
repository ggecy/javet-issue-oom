/* eslint-disable no-var */
// noinspection ES6ConvertVarToLetConst
// noinspection ES6ConvertVarToLetConst

import { TradesDataBroker } from "./trades/trades-data-broker"
import { ExchangeManager } from "./exchanges/exchange-manager";

// eslint-disable
declare global {
    // this has to be var, const or let will not work on globalThis
    var _BEC: CCXTBootloaderBECDelegateInterface;
    var shouldStop: boolean;
    var exchangeManager: ExchangeManager;
    var tradesDataBroker: TradesDataBroker;
}

/**
 * BEC - Bootloader Extended Commands interface
 */
export interface CCXTBootloaderBECDelegateInterface {
    /**
     * Data Streamers to Javet
     */
    onTradesReceived: (brokerName: string, tradesJSON: string) => void
    onBidsAsksReceived: (brokerName: string, bidsAsksJSON: string) => void
}

export type BrokerName = string;