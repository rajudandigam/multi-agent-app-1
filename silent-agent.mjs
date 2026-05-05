import { inspectRun, step } from "agent-inspect";

await inspectRun(
  "silent-local-test",
  async () => {
    await step("quiet-step", async () => "done");
  },
  { silent: true },
);

console.log("Run completed silently. Check CLI list.");