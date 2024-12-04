/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import { CCXTBootloaderBECDelegateInterface } from "./ccxt-bootloader-types";
import { LoggerFactory } from "./logger-factory";

export const BEC: CCXTBootloaderBECDelegateInterface = globalThis._BEC;

export const loggerFactory = new LoggerFactory();