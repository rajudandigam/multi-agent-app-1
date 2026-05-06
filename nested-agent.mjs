import { inspectRun, step } from "agent-inspect";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const result = await inspectRun("trip-planner-local-test", async () => {
  const plan = await step("plan-trip", async () => {
    const draft = await step.llm("mock-gpt", async () => {
      await delay(120);
      return "Plan: museum, dinner, evening walk.";
    });

    return step("parse-plan", async () => {
      await delay(40);
      return draft
        .replace("Plan: ", "")
        .split(", ")
        .map((item) => item.trim());
    });
  });

  const hotels = await step.tool("searchHotels", async () => {
    await delay(80);
    return [{ id: "hotel-1", city: "Kyoto" }];
  });

  return step("finalize", async () => {
    await delay(30);
    return {
      plan,
      hotel: hotels[0],
    };
  });
});

console.log("\nTrip result:", result);