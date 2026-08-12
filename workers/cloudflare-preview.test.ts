import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { handlePreviewRequest, OFFICE_ROUTE_METHODS, type PreviewEnv } from "./cloudflare-preview";

function makeEnv(mode = "sealed") {
  const assetRequests: Request[] = [];
  const secretReads: string[] = [];
  const target: PreviewEnv = {
    PREVIEW_MODE: mode,
    ASSETS: {
      async fetch(request) {
        assetRequests.push(request);
        return new Response("asset-response", { status: 200 });
      },
    },
  };
  const env = new Proxy(target, {
    get(value, property, receiver) {
      if (!(property in value)) {
        secretReads.push(String(property));
        throw new Error(`Unexpected environment access: ${String(property)}`);
      }
      return Reflect.get(value, property, receiver);
    },
  });
  return { env, assetRequests, secretReads };
}

async function readJson(response: Response) {
  return JSON.parse(await response.text());
}

test("static navigation is delegated only while sealed", async () => {
  const { env, assetRequests, secretReads } = makeEnv();
  const response = await handlePreviewRequest(new Request("https://preview.invalid/office/projects"), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset-response");
  assert.equal(assetRequests.length, 1);
  assert.deepEqual(secretReads, []);
});

test("a missing sealed mode fails closed before an API fixture can run", async () => {
  const { env, assetRequests } = makeEnv("");
  const response = await handlePreviewRequest(new Request("https://preview.invalid/api/photos"), env);
  assert.equal(response.status, 503);
  assert.equal(assetRequests.length, 0);
});

test("health proves no data, write, or send capability", async () => {
  const { env } = makeEnv();
  const response = await handlePreviewRequest(new Request("https://preview.invalid/__preview/health"), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), {
    ok: true,
    mode: "sealed",
    baseline: "dpl_95Z1q8QmzTQd1j6SyGryFmfi6A1a",
    dataAccess: false,
    writes: false,
    sends: false,
  });
});

test("photos uses the public deterministic fixture", async () => {
  const { env, secretReads } = makeEnv();
  const response = await handlePreviewRequest(new Request("https://preview.invalid/api/photos"), env);
  const payload = await readJson(response);
  assert.equal(response.status, 200);
  assert.equal(payload.data.length, 27);
  assert.deepEqual(Object.keys(payload.data[0]).sort(), ["category", "createdAt", "description", "displayOrder", "filename", "id"]);
  assert.deepEqual(secretReads, []);
});

test("contact smoke payload is neither stored, sent, nor echoed", async () => {
  const { env, assetRequests, secretReads } = makeEnv();
  const fixture = {
    name: "Preview Fixture",
    phone: "0000000000",
    email: "preview@example.invalid",
    projectType: "Synthetic smoke request",
    location: "Fixture",
  };
  const response = await handlePreviewRequest(new Request("https://preview.invalid/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(fixture),
  }), env);
  const body = await response.text();
  assert.equal(response.status, 503);
  assert.equal(body.includes(fixture.email), false);
  assert.equal(assetRequests.length, 0);
  assert.deepEqual(secretReads, []);
});

test("contact record reads are explicitly denied", async () => {
  const { env } = makeEnv();
  const response = await handlePreviewRequest(new Request("https://preview.invalid/api/contact"), env);
  assert.equal(response.status, 403);
});

test("bare and unknown API or preview paths never fall through to the SPA", async () => {
  const { env, assetRequests } = makeEnv();
  for (const pathname of ["/api", "/api/unknown", "/__preview", "/__preview/unknown"]) {
    const response = await handlePreviewRequest(new Request(`https://preview.invalid${pathname}`), env);
    assert.equal(response.status, 404, pathname);
  }
  assert.equal(assetRequests.length, 0);
});

test("office auth and every Vercel office function surface remain sealed", async () => {
  const { env, assetRequests, secretReads } = makeEnv();
  for (const [pathname, methods] of Object.entries(OFFICE_ROUTE_METHODS)) {
    for (const method of methods) {
      const response = await handlePreviewRequest(new Request(`https://preview.invalid${pathname}`, { method }), env);
      assert.ok(response.status === 401 || response.status === 503, `${method} ${pathname} returned ${response.status}`);
    }
  }
  assert.equal(assetRequests.length, 0);
  assert.deepEqual(secretReads, []);
});

test("the office route matrix exactly covers the Vercel function entries", () => {
  const functionPaths = readdirSync(new URL("../api/office", import.meta.url))
    .filter((name) => name.endsWith(".ts"))
    .map((name) => `/api/office/${name.slice(0, -3)}`)
    .sort();
  assert.deepEqual(Object.keys(OFFICE_ROUTE_METHODS).sort(), functionPaths);
});

test("the Worker and config make no Vercel Blob or Cloudflare storage assumption", () => {
  const worker = readFileSync(new URL("./cloudflare-preview.ts", import.meta.url), "utf8");
  const configSource = readFileSync(new URL("../wrangler.preview.jsonc", import.meta.url), "utf8");
  const config = JSON.parse(configSource);
  assert.equal(worker.includes("@vercel/blob"), false);
  assert.equal(configSource.includes("r2_buckets"), false);
  assert.equal(configSource.includes("d1_databases"), false);
  assert.equal(configSource.includes("kv_namespaces"), false);
  assert.equal(configSource.includes("queues"), false);
  assert.equal("routes" in config, false);
  assert.equal("custom_domains" in config, false);
  assert.deepEqual(config.vars, { PREVIEW_MODE: "sealed" });
});
