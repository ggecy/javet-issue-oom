package org.example;

import java.math.BigDecimal;
import java.util.Objects;

public class JavetTicker {
    private final String symbol;
    private final Long timestamp;
    private final BigDecimal bid;
    private final BigDecimal bidVolume;
    private final BigDecimal ask;
    private final BigDecimal askVolume;

    public JavetTicker(String symbol, Long timestamp, BigDecimal bid, BigDecimal bidVolume, BigDecimal ask, BigDecimal askVolume) {
        this.symbol = symbol;
        this.timestamp = timestamp;
        this.bid = bid;
        this.bidVolume = bidVolume;
        this.ask = ask;
        this.askVolume = askVolume;
    }

    public String getSymbol() {
        return symbol;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public BigDecimal getBid() {
        return bid;
    }

    public BigDecimal getBidVolume() {
        return bidVolume;
    }

    public BigDecimal getAsk() {
        return ask;
    }

    public BigDecimal getAskVolume() {
        return askVolume;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        JavetTicker that = (JavetTicker) o;
        return Objects.equals(symbol, that.symbol) &&
                Objects.equals(timestamp, that.timestamp) &&
                Objects.equals(bid, that.bid) &&
                Objects.equals(bidVolume, that.bidVolume) &&
                Objects.equals(ask, that.ask) &&
                Objects.equals(askVolume, that.askVolume);
    }

    @Override
    public int hashCode() {
        return Objects.hash(symbol, timestamp, bid, bidVolume, ask, askVolume);
    }

    @Override
    public String toString() {
        return "JavetTicker{" +
                "symbol='" + symbol + '\'' +
                ", timestamp=" + timestamp +
                ", bid=" + bid +
                ", bidVolume=" + bidVolume +
                ", ask=" + ask +
                ", askVolume=" + askVolume +
                '}';
    }

}
