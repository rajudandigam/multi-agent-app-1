import { inspectRun, step, observe } from "agent-inspect";

console.log({
  inspectRun: typeof inspectRun,
  step: typeof step,
  stepLlm: typeof step.llm,
  stepTool: typeof step.tool,
  observe: typeof observe,
});