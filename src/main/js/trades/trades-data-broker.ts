// import * as ccxt from 'ccxt';
import { Exchange, Ticker, Trade } from "ccxt";
import { ExchangeManager } from "../exchanges/exchange-manager";
import { BEC, loggerFactory } from "../globals";
import { Logger } from "winston";

interface StreamingExchange {
    readonly brokerName: string;
    readonly exchange: Exchange;
    readonly intervals: NodeJS.Timeout[];
    readonly logger: Logger;
    tradesReceived: number;
    tradesReceivedTotal: number;
    bidsAsksReceived: number;
    bidsAsksReceivedTotal: number;
}

const BATCH_SIZES: Readonly<Record<string, number>> = {
    BINANCE: 200
};

const TRADES_PROCESSING_INTERVAL_MS = 100;
const TICKERS_PROCESSING_INTERVAL_MS = 100;
const REFRESH_SUBSCRIPTIONS_INTERVAL_MS = 10000;

const tradesDataBrokerLogger = loggerFactory.getLogger("TradesDataBroker");

export class TradesDataBroker {

    constructor(private readonly exchangeManager: ExchangeManager) {
    }

    // called from javet
    // noinspection JSUnusedGlobalSymbols
    watchTrades(brokerName: string) {
        this.watchTradesImpl(brokerName)
            .catch((error: unknown) => tradesDataBrokerLogger.error("Error watching trades for exchange %s.", brokerName, { error }));
    }

    // called from javet
    // noinspection JSUnusedGlobalSymbols
    watchBidsAsks(brokerName: string) {
        this.watchBidsAsksImpl(brokerName)
            .catch((error: unknown) => tradesDataBrokerLogger.error("Error watching bids/asks for exchange %s.", brokerName, { error }));
    }

    private async getStreamingExchange(brokerName: string): Promise<StreamingExchange> {
        const exchange = await this.exchangeManager.createExchange({
            brokerName,
            exchangeId: `${brokerName}-streamer`,
            useCcxtPro: true
        });
        exchange.newUpdates = true;
        await exchange.loadMarkets();
        return {
            brokerName,
            exchange,
            intervals: [],
            logger: tradesDataBrokerLogger.child({ meta: [brokerName] }),
            tradesReceived: 0,
            tradesReceivedTotal: 0,
            bidsAsksReceived: 0,
            bidsAsksReceivedTotal: 0
        };
    }

    private runInBatches(batchSize: number, symbols: string[], fun: (batch: string[]) => void) {
        let batch: string[] = [];
        for (const symbol of symbols) {
            batch.push(symbol);
            if (batch.length >= batchSize) {
                // need to make a local copy of batch reference as it will be overwritten in the next iteration and catch method would get wrong batch values
                void fun(batch);
                batch = [];
            }
        }
        if (batch.length > 0) {
            void fun(batch);
        }
    }

    private async watchTradesImpl(brokerName: string) {
        const startTime = Date.now();
        const streamingExchange = await this.getStreamingExchange(brokerName);
        const { logger, intervals, exchange } = streamingExchange;

        const symbols: string[] = exchange.getSymbolsForMarketType('spot');

        const interval = setInterval(() => {
            logger.debug("Received %d trades per minute, total run time: %d seconds", streamingExchange.tradesReceived, (Date.now() - startTime) / 1000);
            streamingExchange.tradesReceived = 0;
        }, 60000);
        intervals.push(interval);

        const batchSize = BATCH_SIZES[brokerName] ?? Number.MAX_SAFE_INTEGER;
        this.runInBatches(batchSize, symbols, batch => {
            logger.debug("Watching trades for symbols %s", batch);
            exchange.watchTradesForSymbols(batch)
                .catch((error: unknown) => logger.error("Error watching trades for symbols: %s.", batch, { error }));
        })
        const refreshInterval = setInterval(() => {
            this.runInBatches(batchSize, symbols, batch => {
                exchange.watchTradesForSymbols(batch)
                    .catch((error: unknown) => logger.error("Error watching trades for symbols:%s.", batch, { error }));
            })
        }, REFRESH_SUBSCRIPTIONS_INTERVAL_MS);
        intervals.push(refreshInterval);

        const lastInitialTradesForSymbols: Record<string, Trade> = {};
        // implemented watchTrades in throttled mode because realtime mode (awaiting promise in infinite loop)
        // had memory leak issue https://github.com/ccxt/ccxt/issues/23972
        const checkNewTradesInterval = setInterval(() => {
            const startTime = Date.now();
            const tradesCache = exchange.trades;
            const trades: Trade[] = [];
            for (const symbol of symbols) {
                const symbolTradesCache = tradesCache[symbol]
                if (!symbolTradesCache) {
                    continue;
                }
                // ArrayCache.getLimit returns number of updated trades since last call, but will not actually reset
                // until there is new trade added to cache for given symbol so we keep track of last initial trade to
                // avoid sending same trades multiple times if there were no new trades added for given symbol
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const limit: number = symbolTradesCache.getLimit(symbol, undefined);
                if (limit > 0) {
                    let first = true;
                    for (let i = symbolTradesCache.length - limit; i < symbolTradesCache.length; i++) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        const trade = symbolTradesCache[i];
                        if (first) {
                            const lastInitialTrade = lastInitialTradesForSymbols[symbol];
                            if (lastInitialTrade === trade) {
                                // cache has the same item on same position, no new trades were added, avoid sending same trades multiple times
                                break;
                            }
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            lastInitialTradesForSymbols[symbol] = trade;
                            first = false;
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        trades.push(trade);
                    }
                }
            }
            const javaProcessingStartTime = Date.now();
            this.processTrades(streamingExchange, trades);
            const duration = Date.now() - startTime;
            if (duration > TRADES_PROCESSING_INTERVAL_MS - 10) {
                logger.warn("Processing trades took %d ms, nodejs might become overloaded (java processing time: %d ms)", duration, Date.now() - javaProcessingStartTime);
            }
        }, TRADES_PROCESSING_INTERVAL_MS);
        intervals.push(checkNewTradesInterval);
    }

    private processTrades(streamingExchange: StreamingExchange, trades: Trade[]) {
        if (!trades.length) {
            return;
        }
        streamingExchange.tradesReceived += trades.length;
        streamingExchange.tradesReceivedTotal += trades.length;
        const { logger, brokerName } = streamingExchange;
        try {
            BEC.onTradesReceived(brokerName, JSON.stringify(trades));
        } catch (error) {
            logger.error("Error in processTrades.", { error });
        }
    }

    private async watchBidsAsksImpl(brokerName: string) {
        const startTime = Date.now();
        const streamingExchange = await this.getStreamingExchange(brokerName);
        const { logger, exchange, intervals } = streamingExchange;

        const symbols: string[] = exchange.getSymbolsForMarketType('spot');

        const interval = setInterval(() => {
            logger.debug("Received %d bidsAsks per minute, total run time: %d seconds", streamingExchange.bidsAsksReceived, (Date.now() - startTime) / 1000);
            streamingExchange.bidsAsksReceived = 0;
        }, 60000);
        intervals.push(interval);

        const batchSize = BATCH_SIZES[brokerName] ?? Number.MAX_SAFE_INTEGER;
        this.runInBatches(batchSize, symbols, batch => {
            logger.debug("Watching bidsAsks for symbols %s", batch);
            exchange.watchBidsAsks(batch)
                .catch((error: unknown) => logger.error("Error watching bids/asks for symbols: %s.", batch, { error }));
        });
        const refreshInterval = setInterval(() => {
            this.runInBatches(batchSize, symbols, batch => {
                exchange.watchBidsAsks(batch)
                    .catch((error: unknown) => logger.error("Error watching bids/asks for symbols:%s.", batch, { error }));
            });
        }, REFRESH_SUBSCRIPTIONS_INTERVAL_MS);
        intervals.push(refreshInterval);

        const lastTickersForSymbols: Record<string, Ticker> = {};
        // implemented watchBidsAsks in throttled mode because realtime mode (awaiting promise in infinite loop)
        // had memory leak issue https://github.com/ccxt/ccxt/issues/23972
        const checkNewBidsAsksInterval = setInterval(() => {
            const startTime = Date.now();
            const bidsAsks = exchange.bidsasks;
            const tickers: Ticker[] = [];
            for (const symbol of symbols) {
                const symbolTicker = bidsAsks[symbol]
                if (!symbolTicker || symbolTicker === lastTickersForSymbols[symbol]) {
                    continue;
                }
                lastTickersForSymbols[symbol] = symbolTicker;
                tickers.push(symbolTicker);
            }
            const javaProcessingStartTime = Date.now();
            this.processBidsAsks(streamingExchange, tickers);
            const duration = Date.now() - startTime;
            if (duration > TICKERS_PROCESSING_INTERVAL_MS - 10) {
                logger.warn("Processing bidsAsks took %d ms, nodejs might become overloaded (java processing time: %d ms)", duration, Date.now() - javaProcessingStartTime);
            }
        }, TICKERS_PROCESSING_INTERVAL_MS);
        intervals.push(checkNewBidsAsksInterval);
    }

    private processBidsAsks(streamingExchange: StreamingExchange, tickers: Ticker[]) {
        if (!tickers.length) {
            return;
        }
        streamingExchange.bidsAsksReceived += tickers.length;
        streamingExchange.bidsAsksReceivedTotal += tickers.length;
        const { logger, brokerName } = streamingExchange;
        try {
            BEC.onBidsAsksReceived(brokerName, JSON.stringify(tickers));
        } catch (error) {
            logger.error("Error in processBidsAsks", { error });
        }
    }
}

