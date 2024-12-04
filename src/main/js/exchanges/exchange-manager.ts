import ccxt, { Exchange } from "ccxt";
import { BrokerName } from "../ccxt-bootloader-types";
import { getExchangeName } from "./broker-mapping";
import { Table } from "../collections";

export interface CreateExchangeOptions {
    brokerName: string,
    exchangeId: string,
    config?: Record<string, unknown>,
    useCcxtPro?: boolean
}

type ExchangeId = string;

// noinspection JSUnusedGlobalSymbols
export class ExchangeManager {

    private exchanges = new Table<BrokerName, ExchangeId, Exchange>();

    async createExchange(options: CreateExchangeOptions) {
        const { brokerName, exchangeId, config, useCcxtPro = false } = options;
        const exchangeName = getExchangeName(brokerName);
        if (!exchangeName) {
            throw new Error("Failed to create exchange, unknown broker: " + brokerName);
        }
        let ccxtObj: unknown;
        if (useCcxtPro) {
            ccxtObj = ccxt.pro;
        } else {
            ccxtObj = ccxt;
        }
        const defaultConfig = await this.getExchangeConfig(brokerName);
        // eslint-disable-next-line
        const exchange: Exchange = new (ccxtObj as any)[exchangeName]({...defaultConfig, ...config});
        exchange.id = exchangeId;

        this.exchanges.set(brokerName, exchange.id, exchange);
        return exchange;
    }

    private async getExchangeConfig(brokerName: string): Promise<Record<string, unknown>> {
        const config: Record<string, unknown> = {};
        // config.verbose = true;
        config.enableRateLimit = true;
        config.options = {
            warnOnFetchOpenOrdersWithoutSymbol: false,
            fetchCurrencies: true,
            maxRetriesOnFailure: 3,
            maxRetriesOnFailureDelay: 1000
        } as Record<string, unknown>;
        return config;
    }

}