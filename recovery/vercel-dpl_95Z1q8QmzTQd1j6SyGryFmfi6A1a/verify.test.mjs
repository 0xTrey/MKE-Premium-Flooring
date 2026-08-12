import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { verifyRecovery } from "./verify.mjs";

const recoveryRoot = dirname(fileURLToPath(import.meta.url));
const manifestName = "source-manifest.json";

function fixture() {
  const temporary = mkdtempSync(join(tmpdir(), "mke-vercel-recovery-test-"));
  const root = join(temporary, "recovery");
  cpSync(recoveryRoot, root, { recursive: true, filter: (source) => !source.endsWith("verify.test.mjs") });
  return { root, cleanup: () => rmSync(temporary, { recursive: true }) };
}

function mutateManifest(root, mutate) {
  const path = join(root, manifestName);
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  mutate(manifest);
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}

function rejectsManifestPath(path) {
  const current = fixture();
  try {
    mutateManifest(current.root, (manifest) => { manifest.files[0].path = path; });
    assert.throws(() => verifyRecovery(current.root), /path|normalized/i);
  } finally {
    current.cleanup();
  }
}

test("accepts the exact pinned recovery set", () => {
  assert.equal(verifyRecovery(recoveryRoot), 235);
});

test("rejects traversal, absolute, backslash, and non-normalized manifest paths", () => {
  for (const path of ["../outside", "/absolute", "C:\\absolute", "dist\\asset.js", "dist//asset.js", "./dist/asset.js"]) {
    rejectsManifestPath(path);
  }
});

test("rejects duplicate manifest paths", () => {
  const current = fixture();
  try {
    mutateManifest(current.root, (manifest) => { manifest.files[1].path = manifest.files[0].path; });
    assert.throws(() => verifyRecovery(current.root), /duplicate path/i);
  } finally {
    current.cleanup();
  }
});

test("rejects manifest omission and extra entries", () => {
  for (const mutate of [
    (manifest) => { manifest.files.pop(); manifest.sourceFiles -= 1; },
    (manifest) => { manifest.files.push({ path: "unexpected.txt", sha1: "0".repeat(40) }); manifest.sourceFiles += 1; },
  ]) {
    const current = fixture();
    try {
      mutateManifest(current.root, mutate);
      assert.throws(() => verifyRecovery(current.root), /path set|total/i);
    } finally {
      current.cleanup();
    }
  }
});

test("rejects an incorrect declared sourceFiles count", () => {
  const current = fixture();
  try {
    mutateManifest(current.root, (manifest) => { manifest.sourceFiles += 1; });
    assert.throws(() => verifyRecovery(current.root), /sourceFiles count/i);
  } finally {
    current.cleanup();
  }
});

test("rejects symbolic links in the recovered artifact tree", () => {
  const current = fixture();
  try {
    const asset = join(current.root, "artifacts/dist/public/assets/index-B-hcmYCV.js");
    const target = `${asset}.real`;
    renameSync(asset, target);
    symlinkSync(target, asset);
    assert.throws(() => verifyRecovery(current.root), /symbolic link/i);
  } finally {
    current.cleanup();
  }
});

test("rejects an unexpected recovered artifact", () => {
  const current = fixture();
  try {
    writeFileSync(join(current.root, "artifacts/unexpected.txt"), "unexpected");
    assert.throws(() => verifyRecovery(current.root), /artifact path set/i);
  } finally {
    current.cleanup();
  }
});
