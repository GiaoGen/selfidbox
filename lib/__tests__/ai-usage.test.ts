import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { trackAIError } from "@/lib/ai/track-ai-usage";
import AdminAIUsagePage from "@/app/admin/ai-usage/page";
import AdminLayout from "@/app/admin/layout";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createServiceClient: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  getCredits: vi.fn(),
  spendCredit: vi.fn(),
  checkRateLimit: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: mocks.createServiceClient }));
vi.mock("@/lib/credits/service", () => ({
  getCredits: mocks.getCredits,
  spendCredit: mocks.spendCredit,
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));

const results = [
  { key: "a", name: "A", description: "Result A", traits: ["calm"] },
  { key: "b", name: "B", description: "Result B", traits: ["bold"] },
];
const factors = [{ key: "social", name: "Social" }, { key: "sensitivity", name: "Sensitivity" }];
const question = { text: "Question?", options: [{ label: "A", text: "Yes", factor_effects: { social: 1 } }] };
const usage = { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 };
const requestBody = { title: "Test", result_count: 2, results, factors, userId: "forged-user" };

const routes = [
  {
    name: "results",
    load: () => import("@/app/api/quiz-ai/generate-results/route"),
    valid: { results },
    invalid: [{ results: [null] }, { results: [{}] }, { results: [{ key: "a" }] }, { results: [{ key: "a", name: "A" }] }],
  },
  {
    name: "factors",
    load: () => import("@/app/api/quiz-ai/generate-factors/route"),
    valid: { factors },
    invalid: [{ factors: [null] }, { factors: [{ key: "unknown" }] }, { factors: [factors[0], factors[0]] }, { factors: [{ key: "social" }] }],
  },
  {
    name: "result_vectors",
    load: () => import("@/app/api/quiz-ai/generate-result-vectors/route"),
    valid: { result_vectors: { a: { social: 80, sensitivity: 20 }, b: { social: 20, sensitivity: 80 } } },
    invalid: [{ result_vectors: {} }, { result_vectors: { a: { social: 101 } } }],
  },
  {
    name: "questions",
    load: () => import("@/app/api/quiz-ai/generate-questions/route"),
    valid: { questions: [question] },
    invalid: [
      { questions: [null] },
      { questions: [{}] },
      { questions: [{ text: "Q" }] },
      ...[null, {}, { label: "A" }, { label: "A", text: "Yes" },
        { label: "A", text: "Yes", factor_effects: { unknown: 1 } },
        { label: "A", text: "Yes", factor_effects: { social: 4 } },
        { label: "A", text: "Yes", factor_effects: {} },
      ].map((option) => ({ questions: [{ text: "Q", options: [option] }] })),
    ],
  },
];

beforeAll(() => {
  vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "authenticated-user" } } });
  mocks.createServiceClient.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.getCredits.mockResolvedValue({ balance: { available: 10 } });
  mocks.spendCredit.mockResolvedValue(9);
  mocks.checkRateLimit.mockReturnValue(true);
  vi.stubGlobal("fetch", mocks.fetch);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function request(body: unknown = requestBody) {
  return new NextRequest("http://localhost/api/quiz-ai/test", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function aiResponse(content: string) {
  mocks.fetch.mockResolvedValue(Response.json({ choices: [{ message: { content } }], usage }));
}

describe.each(routes)("$name usage tracking", (route) => {
  let post: (request: NextRequest) => Promise<Response>;
  beforeAll(async () => { post = (await route.load()).POST; });

  function expectRecord(success: boolean, tokens = usage) {
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.createServiceClient).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("ai_usage_logs");
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      user_id: "authenticated-user",
      feature: `quiz_generate_${route.name}`,
      model: "deepseek-chat",
      success,
      ...tokens,
    }));
  }

  it("records success with authenticated ownership and provider tokens", async () => {
    aiResponse(JSON.stringify(route.valid));
    const response = await post(request());
    expect(response.status).toBe(200);
    expectRecord(true);
    expect(mocks.insert.mock.calls[0][0].estimated_cost).toBeGreaterThan(0);
    expect(mocks.spendCredit).toHaveBeenCalledExactlyOnceWith("authenticated-user");
  });

  it.each(["", "invalid-json", "{}"])("records failed output %j with its tokens", async (content) => {
    aiResponse(content);
    expect((await post(request())).status).toBe(502);
    expectRecord(false);
    expect(mocks.spendCredit).not.toHaveBeenCalled();
  });

  it.each(route.invalid.map((content) => [content]))("records schema validation failures %j", async (content) => {
    aiResponse(JSON.stringify(content));
    expect((await post(request())).status).toBe(502);
    expectRecord(false);
    expect(mocks.spendCredit).not.toHaveBeenCalled();
  });

  it("retains tokens if post-processing throws", async () => {
    aiResponse("null");
    expect((await post(request())).status).toBe(500);
    expectRecord(false);
  });

  it("records an upstream HTTP failure once", async () => {
    mocks.fetch.mockResolvedValue(new Response("Unavailable", { status: 503 }));
    expect((await post(request())).status).toBe(502);
    expectRecord(false, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
  });

  it("records a network failure once", async () => {
    mocks.fetch.mockRejectedValueOnce(new Error("Network failure"));
    expect((await post(request())).status).toBe(500);
    expectRecord(false, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
  });

  it.each(["returned error", "rejection", "client configuration"])("preserves success on logging %s", async (failure) => {
    aiResponse(JSON.stringify(route.valid));
    if (failure === "returned error") mocks.insert.mockResolvedValueOnce({ error: { message: "Denied" } });
    if (failure === "rejection") mocks.insert.mockRejectedValueOnce(new Error("Disconnected"));
    if (failure === "client configuration") mocks.createServiceClient.mockImplementationOnce(() => { throw new Error("Missing key"); });
    expect((await post(request())).status).toBe(200);
    expect(console.error).toHaveBeenCalledWith("[ai-usage] Insert failed:", expect.any(String));
    expect(mocks.insert).toHaveBeenCalledTimes(failure === "client configuration" ? 0 : 1);
  });

  it("waits for the log write before returning the response", async () => {
    aiResponse(JSON.stringify(route.valid));
    let finish!: (value: { error: null }) => void;
    mocks.insert.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    let completed = false;
    const pending = post(request()).then((response) => { completed = true; return response; });
    await vi.waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1));
    expect(completed).toBe(false);
    finish({ error: null });
    expect((await pending).status).toBe(200);
    expectRecord(true);
  });

  it.each(["unauthenticated", "rate limited", "no credits", "invalid input"])("does not record requests rejected before AI: %s", async (reason) => {
    if (reason === "unauthenticated") mocks.getUser.mockResolvedValueOnce({ data: { user: null } });
    if (reason === "rate limited") mocks.checkRateLimit.mockReturnValueOnce(false);
    if (reason === "no credits") mocks.getCredits.mockResolvedValueOnce({ balance: { available: 0 } });
    const response = await post(request(reason === "invalid input" ? {} : requestBody));
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

it("does not throw when recording an AI failure encounters a database error", async () => {
  mocks.insert.mockResolvedValueOnce({ error: { message: "Denied" } });
  await expect(trackAIError({ feature: "test", errorMessage: "AI failed" })).resolves.toBeUndefined();
  expect(mocks.insert).toHaveBeenCalledOnce();
  expect(console.error).toHaveBeenCalledWith("[ai-usage] Insert failed:", "Denied");
});

describe("AI Usage admin page", () => {
  function queryResult(data: unknown[], error: { message: string } | null = null) {
    const limit = vi.fn().mockResolvedValue({ data, error });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    mocks.from.mockReturnValue({ select });
    return { select, order, limit };
  }

  it("renders exactly one sidebar and main region through the admin layout", async () => {
    vi.stubEnv("ADMIN_USER_IDS", "authenticated-user");
    const query = queryResult([]);
    const html = renderToStaticMarkup(await AdminLayout({ children: await AdminAIUsagePage() }));
    expect(html.match(/<aside\b/g)).toHaveLength(1);
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html).toContain("暂无记录。");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(200);
  });

  it("renders fetched usage rows", async () => {
    queryResult([{
      id: "log-1", created_at: "2026-11-02T00:00:00Z", feature: "quiz_generate_results",
      model: "deepseek-chat", ...usage, estimated_cost: 0.001, success: true,
    }]);
    const html = renderToStaticMarkup(await AdminAIUsagePage());
    expect(html).toContain("quiz_generate_results");
    expect(html).toContain("150");
    expect(html).toContain("$0.001000");
    expect(html).toContain("OK");
  });

  it.each(["query", "configuration"])("shows a load error instead of empty records on %s failure", async (failure) => {
    if (failure === "query") queryResult([], { message: "Denied" });
    else mocks.createServiceClient.mockImplementationOnce(() => { throw new Error("Missing key"); });
    const html = renderToStaticMarkup(await AdminAIUsagePage());
    expect(html).toContain('role="alert"');
    expect(html).toContain("加载调用记录失败");
    expect(html).not.toContain("暂无记录。");
  });
});
