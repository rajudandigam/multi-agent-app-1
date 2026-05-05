import { inspectRun, step } from "agent-inspect";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

try {
  await inspectRun("pricing-error-local-test", async () => {
    await step("load-catalog", async () => {
      await delay(50);
      return ["sku-a", "sku-b"];
    });

    await step("fetch-dynamic-pricing", async () => {
      await delay(80);
      throw new Error("Pricing API timeout");
    });

    await step("apply-discount", async () => {
      await delay(20);
      return "should not run";
    });
  });
} catch (error) {
  console.log("\nCaught original error:", error.message);
}