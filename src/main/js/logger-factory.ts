import winston from "winston"
import Transport from "winston-transport";
import { LEVEL, MESSAGE } from "triple-beam";

const { combine, label, printf, splat } = winston.format

type Level = string;

export class LoggerFactory {

    private readonly customFormat?: winston.Logform.Format;

    constructor() {
        this.customFormat = this.createFormat();
    }

    private createFormat() {
        return printf((info) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { message, label, error } = info;
            if (error) {
                return `[${label}]${this.printMeta(info)}: ${message} ${this.stringifyError(error)}`;
            }
            return `[${label}]${this.printMeta(info)}: ${message}`;
        });
    }

    // private readonly excludedProperties = ["level", "message", "label", "timestamp", "error"];

    private printMeta(info: winston.Logform.TransformableInfo) {
        if (info.meta && Array.isArray(info.meta)) {
            return `[${info.meta
                .map((item) => {
                    if (typeof item === "object") {
                        return JSON.stringify(item);
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return item;
                })
                .join(", ")}]`;
        }
        // if (Array.isArray(info) && info.length) {
        //     return `[${info
        //         .map((item) => {
        //             if (typeof item === "object") {
        //                 return JSON.stringify(item);
        //             }
        //             // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        //             return item;
        //         })
        //         .join(", ")}]`;
        // }
        // const meta = Object.keys(info)
        //     .filter(key => !this.excludedProperties.includes(key))
        //     .map(key => {
        //         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        //         let value = info[key];
        //         if (typeof value === "object") {
        //             value = JSON.stringify(value);
        //         }
        //         return `${key}: ${value}`;
        //     })
        // if (meta.length) {
        //     return `[${meta.join(", ")}]`;
        // }
        return "";
    }

    private stringifyError(error: unknown, references: Set<Error> = new Set()): string {
        let result: string;
        if (error instanceof Error) {
            result = error.stack ?? error.message;
            if (!references.has(error)) {
                references.add(error);
                if (error.cause) {
                    result += `\nCaused by ${this.stringifyError(error.cause, references)}`;
                }
            }
        } else if (typeof error === "string") {
            result = error;
        } else {
            result = JSON.stringify(error);
        }
        return result;
    }

    getLogger(name: string) {
        if (!winston.loggers.has(name)) {
            // adding extra check to avoid building format if loader already exists
            // get and add do the same thing
            return winston.loggers.add(name,  {
                level: "debug",
                format: this.buildLoggerFormat(name),
                transports: [new CustomConsoleTransport()]
            })
        }
        return winston.loggers.get(name);
    }

    private buildLoggerFormat(name: string) {
        /*
         Not using errors() because it doesn't work together with message,
         instead expecting metadata to contain error property, e.g. logger.error("some error message", { error })
         which is handled in customFormat.
         Also using printf instead of json() to make log messages appear naturally in spring boot logs through javet
         console interceptor.
        */
        return combine(label({ label: name}), splat(), this.customFormat!);
    }
}

/* eslint-disable */
/**
 * Custom transport that uses console to log messages which are then intercepted by javet console interceptor and appear
 * in standard spring boot log files. All formatting is done by winston logger to avoid the slow formatting on the javet side.
 * This has a downside of looking weird in debugger console when running in node.js environment without javet.
 */
class CustomConsoleTransport extends Transport {
    constructor(options: Transport.TransportStreamOptions = {}) {
        super(options);
    }

    override log(info: any, next: () => void): any {
        setImmediate(() => this.emit('logged', info));

        const level = info[LEVEL];
        if (level === 'debug') {
            console.debug(info[MESSAGE]);
        } else if (level === 'info') {
            console.info(info[MESSAGE]);
        } else if (level === 'warn') {
            console.warn(info[MESSAGE]);
        } else if (level === 'error') {
            console.error(info[MESSAGE]);
        } else {
            console.log(info[MESSAGE]);
        }

        next?.();
    }
}
/* eslint-enable */
