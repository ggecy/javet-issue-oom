package org.example;

import java.math.BigDecimal;
import java.util.Objects;

public class JavetTrade {
    private final Long timestamp;
    private final String symbol;
    private final String side;
    private final String takerOrMaker;
    private final BigDecimal price;
    private final BigDecimal amount;

    public JavetTrade(Long timestamp, String symbol, String side, String takerOrMaker, BigDecimal price, BigDecimal amount) {
        this.timestamp = timestamp;
        this.symbol = symbol;
        this.side = side;
        this.takerOrMaker = takerOrMaker;
        this.price = price;
        this.amount = amount;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public String getSymbol() {
        return symbol;
    }

    public String getSide() {
        return side;
    }

    public String getTakerOrMaker() {
        return takerOrMaker;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        JavetTrade that = (JavetTrade) o;
        return Objects.equals(timestamp, that.timestamp) &&
                Objects.equals(symbol, that.symbol) &&
                Objects.equals(side, that.side) &&
                Objects.equals(takerOrMaker, that.takerOrMaker) &&
                Objects.equals(price, that.price) &&
                Objects.equals(amount, that.amount);
    }

    @Override
    public int hashCode() {
        return Objects.hash(timestamp, symbol, side, takerOrMaker, price, amount);
    }

    @Override
    public String toString() {
        return "JavetTrade{" +
                "timestamp=" + timestamp +
                ", symbol='" + symbol + '\'' +
                ", side='" + side + '\'' +
                ", takerOrMaker='" + takerOrMaker + '\'' +
                ", price=" + price +
                ", amount=" + amount +
                '}';
    }
}

