import http from "node:http";
import { inspectRun, step, observe } from "agent-inspect";

const PORT = Number(process.env.PORT ?? 3000);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function runBasic() {
  return inspectRun("server-basic", async () => {
    const hotels = await step("search-hotels", async () => {
      await delay(40);
      return ["Tokyo Grand Hotel", "Tokyo Central Inn"];
    });
    const availability = await step("check-availability", async () => {
      await delay(30);
      return { hotel: hotels[0], rooms: 2 };
    });
    return step("finalize-booking", async () => {
      await delay(20);
      return `confirmed:${availability.hotel}`;
    });
  });
}

async function runNested() {
  return inspectRun("server-nested", async () => {
    const plan = await step("plan-trip", async () => {
      const draft = await step.llm("mock-gpt", async () => {
        await delay(40);
        return "Plan: museum, dinner, evening walk.";
      });
      return step("parse-plan", async () => {
        await delay(15);
        return draft.replace("Plan: ", "").split(", ");
      });
    });
    const hotels = await step.tool("searchHotels", async () => {
      await delay(25);
      return [{ id: "hotel-1", city: "Kyoto" }];
    });
    return step("finalize", async () => ({ plan, hotel: hotels[0] }));
  });
}

async function runParallel() {
  return inspectRun("server-parallel", async () => {
    return step("collect-context", async () => {
      const [weather, events, prices] = await Promise.all([
        step.tool("fetchWeather", async () => {
          await delay(40);
          return { condition: "sunny" };
        }),
        step.tool("fetchEvents", async () => {
          await delay(30);
          return ["food market", "jazz night"];
        }),
        step.tool("fetchHotelPrices", async () => {
          await delay(20);
          return [{ hotel: "Hotel A", price: 120 }];
        }),
      ]);
      return step("merge-context", async () => ({ weather, events, prices }));
    });
  });
}

async function runError() {
  try {
    await inspectRun("server-error", async () => {
      await step("load-catalog", async () => {
        await delay(20);
        return ["sku-a", "sku-b"];
      });
      await step("fetch-dynamic-pricing", async () => {
        await delay(25);
        throw new Error("Pricing API timeout");
      });
    });
  } catch (error) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "expected throw did not occur" };
}

async function runObserve() {
  class SupportAgent {
    async run(question) {
      const category = await step("triage-question", async () => {
        await delay(20);
        return question.toLowerCase().includes("password")
          ? "account-access"
          : "general";
      });
      const articles = await step.tool("retrieveArticles", async () => {
        await delay(25);
        return [
          "Reset your password from the login page.",
          "Use account recovery if you no longer have email access.",
        ];
      });
      return step.llm("mock-support-model", async () => {
        await delay(30);
        return `Category: ${category}. ${articles[0]}`;
      });
    }
  }
  const agent = observe(new SupportAgent());
  const reply = await agent.run("How do I reset my password?");
  return { reply };
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const routes = {
  "/health": async () => ({ ok: true, status: "healthy" }),
  "/basic": async () => ({ ok: true, result: await runBasic() }),
  "/nested": async () => ({ ok: true, result: await runNested() }),
  "/parallel": async () => ({ ok: true, result: await runParallel() }),
  "/observe": async () => ({ ok: true, result: await runObserve() }),
  "/error": async () => runError(),
};

const server = http.createServer(async (req, res) => {
  if (req.method !== "GET") {
    return send(res, 405, { ok: false, error: "method-not-allowed" });
  }
  const path = (req.url ?? "/").split("?")[0];
  const handler = routes[path];
  if (!handler) {
    return send(res, 404, { ok: false, error: `no route for ${path}` });
  }
  try {
    const body = await handler();
    const status = body && body.ok === false ? 500 : 200;
    send(res, status, body);
  } catch (err) {
    send(res, 500, { ok: false, error: err?.message ?? "unknown error" });
  }
});

server.listen(PORT, () => {
  console.log(
    `multi-agent-app-1 server listening on http://localhost:${PORT}`,
  );
  console.log(
    "Routes: /health /basic /nested /parallel /error /observe",
  );
});
