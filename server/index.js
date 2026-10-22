import { config } from "./config.js";
import { createStore } from "./store.js";
import { createApp } from "./app.js";
const store = await createStore();
const server = createApp(store, config()).listen(
  process.env.PORT || 3001,
  "0.0.0.0",
  () =>
    console.log(
      `StockWise API running at http://localhost:${process.env.PORT || 3001}`,
    ),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    server.close(async () => {
      await store.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
