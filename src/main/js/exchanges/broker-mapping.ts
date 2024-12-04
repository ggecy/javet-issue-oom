const brokersToExchangeNames: Readonly<Record<string, string>> = {
    BINANCE: "binance",
    BINANCEUS: "binanceus",
    HITBTC: "hitbtc",
    BITFINEX: "bitfinex",
    KRAKEN: "kraken",
    GATEIO: "gate",
} as const;

const exchangeNamesToBrokers: Readonly<Record<string, string>> = Object.entries(brokersToExchangeNames)
    .reduce((acc, [broker, exchange]) => {
        acc[exchange] = broker;
        return acc;
    }, {} as Record<string, string>);

export function getExchangeName(brokerName: string): string {
    return brokersToExchangeNames[brokerName] ?? brokerName.toLowerCase();
}

// noinspection JSUnusedGlobalSymbols
export function getBrokerName(exchangeName: string): string {
    return exchangeNamesToBrokers[exchangeName] ?? exchangeName.toUpperCase();
}