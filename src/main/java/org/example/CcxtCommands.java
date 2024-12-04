package org.example;

import com.caoccao.javet.annotations.V8Function;
import com.caoccao.javet.exceptions.JavetException;
import com.caoccao.javet.interop.V8Runtime;
import com.caoccao.javet.values.reference.V8ValueObject;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

public class CcxtCommands {

    private final V8Runtime v8Runtime;
    private final ObjectMapper objectMapper;
    private long lastBidsAsksCountLogged = 0;
    private long bidsAsksCount = 0;
    private long lastTradesCountLogged = 0;
    private long tradesCounter = 0;

    public CcxtCommands(V8Runtime v8Runtime, ObjectMapper objectMapper) {
        this.v8Runtime = v8Runtime;
        this.objectMapper = objectMapper;
    }

    public void watchBidsAsks(String brokerName) throws JavetException {
        try (var tradesDataBroker = (V8ValueObject) v8Runtime.getGlobalObject().get("tradesDataBroker")) {
            tradesDataBroker.invokeVoid("watchBidsAsks", brokerName);
        }
    }

    public void watchTrades(String brokerName) throws JavetException {
        try (var tradesDataBroker = (V8ValueObject) v8Runtime.getGlobalObject().get("tradesDataBroker")) {
            tradesDataBroker.invokeVoid("watchTrades", brokerName);
        }
    }

    @V8Function(name = "onBidsAsksReceived")
    public void onBidsAsksReceived(String brokerName, String dataJSON) {
        if (dataJSON == null || dataJSON.isEmpty()) {
            return;
        }
        try {
            var parsedData = objectMapper.readValue(dataJSON, List.class);
            if (!parsedData.isEmpty()) {
                bidsAsksCount += parsedData.size();
                if (bidsAsksCount - lastBidsAsksCountLogged >= 1000) {
                    lastBidsAsksCountLogged = bidsAsksCount;
                    System.out.println("[onBidsAsksReceived] " + brokerName + " - " + bidsAsksCount + " - " + parsedData.size());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @V8Function(name = "onTradesReceived")
    public void onTradesReceived(String brokerName, String dataJSON) {
        if (dataJSON == null || dataJSON.isEmpty()) {
            return;
        }
        try {
            var parsedData = objectMapper.readValue(dataJSON, List.class);
            if (!parsedData.isEmpty()) {
                tradesCounter += parsedData.size();
                if (tradesCounter - lastTradesCountLogged >= 1000) {
                    lastTradesCountLogged = tradesCounter;
                    System.out.println("[onTradesReceived] " + brokerName + " - " + tradesCounter + " - " + parsedData.size());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}