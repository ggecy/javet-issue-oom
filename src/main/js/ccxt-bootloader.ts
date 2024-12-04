import process from 'process';
import { loggerFactory } from "./globals";
import { TradesDataBroker } from "./trades/trades-data-broker";
import { ExchangeManager } from "./exchanges/exchange-manager";

const logger = loggerFactory.getLogger("ccxt-bootloader");
/**
 * Javet promise rejection handler
 */
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection: %s',reason)
});

function init(){
    logger.info("Initializing...") // should be on top as entrypoint log

    globalThis.exchangeManager = new ExchangeManager();
    globalThis.tradesDataBroker = new TradesDataBroker(exchangeManager);

    setInterval(() => {
        if (globalThis.shouldStop) {
            logger.info("keepAliveInterval is stopped.")
        }
    }, 5000);

    logMemoryUsage();
    setInterval(() => {
        logMemoryUsage();
    }, 60000);
}

function logMemoryUsage() {
    const megaByte = 1024 * 1024;
    let message = "Node.js memory usage:";
    for (const [key,value] of Object.entries(process.memoryUsage())){
        message += `\n\t${key}: ${value/megaByte} MB`
    }
    logger.info(message);
}

init();