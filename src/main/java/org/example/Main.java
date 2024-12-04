package org.example;

import com.caoccao.javet.enums.V8AwaitMode;
import com.caoccao.javet.interception.logging.JavetStandardConsoleInterceptor;
import com.caoccao.javet.interop.V8Host;
import com.caoccao.javet.interop.V8Runtime;
import com.caoccao.javet.interop.callback.JavetBuiltInModuleResolver;
import com.caoccao.javet.interop.options.NodeRuntimeOptions;
import com.caoccao.javet.utils.JavetDefaultLogger;
import com.caoccao.javet.values.reference.V8ValueObject;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) throws Exception {
        NodeRuntimeOptions.V8_FLAGS.setUseStrict(false);
        V8Host.getNodeInstance().enableGCNotification();
        V8Runtime runtime = V8Host.getNodeInstance().createV8Runtime();
        runtime.setLogger(new JavetDefaultLogger(Main.class.getName()));
        runtime.setV8ModuleResolver(new JavetBuiltInModuleResolver());

        var javetConsoleInterceptor = new JavetStandardConsoleInterceptor(runtime);
        javetConsoleInterceptor.register(runtime.getGlobalObject());

        var objectMapper = new ObjectMapper();
        var ccxtCommands = new CcxtCommands(runtime, objectMapper);
        V8ValueObject jsBootloaderActions = runtime.createV8ValueObject();
        runtime.getGlobalObject().set("_BEC", jsBootloaderActions);
        jsBootloaderActions.bind(ccxtCommands);

        var script = Files.readString(Path.of("dist/bundle.cjs"));
        var executor = runtime.getExecutor(script);
        executor.setModule(true);
        executor.executeVoid();
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                ccxtCommands.watchBidsAsks("GATEIO");
                ccxtCommands.watchTrades("GATEIO");
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
        while (true) {
            runtime.await(V8AwaitMode.RunTillNoMoreTasks);
        }
    }
}