import { observe, step } from "agent-inspect";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CustomerSupportAgent {
  async run(question) {
    const category = await step("triage-question", async () => {
      await delay(50);
      return question.toLowerCase().includes("password")
        ? "account-access"
        : "general";
    });

    const articles = await step.tool("retrieveArticles", async () => {
      await delay(80);
      return [
        "Reset your password from the login page.",
        "Use account recovery if you no longer have email access.",
      ];
    });

    return step.llm("mock-support-model", async () => {
      await delay(100);
      return `Category: ${category}. ${articles[0]}`;
    });
  }
}

const agent = observe(new CustomerSupportAgent());

const reply = await agent.run("How do I reset my password?");

console.log("\nSupport reply:", reply);