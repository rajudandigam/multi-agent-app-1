import { inspectRun, step } from "agent-inspect";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const result = await inspectRun("parallel-local-test", async () => {
  return step("collect-context", async () => {
    const [weather, events, prices] = await Promise.all([
      step.tool("fetchWeather", async () => {
        await delay(120);
        return { condition: "sunny" };
      }),

      step.tool("fetchEvents", async () => {
        await delay(80);
        return ["food market", "jazz night"];
      }),

      step.tool("fetchHotelPrices", async () => {
        await delay(50);
        return [{ hotel: "Hotel A", price: 120 }];
      }),
    ]);

    return step("merge-context", async () => {
      await delay(20);
      return { weather, events, prices };
    });
  });
});

console.log("\nParallel result:", result);