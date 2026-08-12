import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, posix, relative, resolve, win32 } from "node:path";
import { fileURLToPath } from "node:url";

const moduleRoot = dirname(fileURLToPath(import.meta.url));
const EXPECTED_DEPLOYMENT_ID = "dpl_95Z1q8QmzTQd1j6SyGryFmfi6A1a";
const EXPECTED_PROJECT_ID = "prj_i2JrAi8oKyqZjjx4933ghgxk5VsB";
const EXPECTED_SOURCE_COMMIT = "743d03079d2a570703d7fd7dde5e71f6c13b1372";
const EXPECTED_SOURCE_FILES = 235;
const REPOSITORY_ONLY_PATHS = new Set([".dockerignore", ".gitignore"]);
const RECOVERED_ASSET_PATHS = new Set([
  "dist/public/assets/index-B-hcmYCV.js",
  "dist/public/assets/index-f4zIbu-N.css",
]);

const sha1 = (bytes) => createHash("sha1").update(bytes).digest("hex");

function assertSafeRelativePath(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new Error(`${label} is not a non-empty path.`);
  }
  if (value.includes("\\") || posix.isAbsolute(value) || win32.isAbsolute(value)) {
    throw new Error(`${label} is not a portable relative path.`);
  }
  const segments = value.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`${label} is not normalized.`);
  }
  if (posix.normalize(value) !== value) {
    throw new Error(`${label} is not normalized.`);
  }
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value));
}

function assertSetEquality(actual, expected, label) {
  const missing = setDifference(expected, actual);
  const extra = setDifference(actual, expected);
  if (missing.length || extra.length) {
    throw new Error(`${label} differs from the expected set (missing ${missing.length}, extra ${extra.length}).`);
  }
}

function gitTreePaths(sourceCommit) {
  const output = execFileSync("git", ["ls-tree", "-rz", "--full-tree", sourceCommit]);
  const entries = output.toString().split("\0").filter(Boolean);
  const paths = new Set();
  for (const entry of entries) {
    const tab = entry.indexOf("\t");
    const [mode, type] = entry.slice(0, tab).split(" ");
    const path = entry.slice(tab + 1);
    assertSafeRelativePath(path, "Git tree path");
    if (type !== "blob" || mode === "120000") {
      throw new Error("The pinned Git tree contains an unsupported entry.");
    }
    paths.add(path);
  }
  return paths;
}

function expectedSourcePaths(sourceCommit) {
  const gitPaths = gitTreePaths(sourceCommit);
  for (const excluded of REPOSITORY_ONLY_PATHS) {
    if (!gitPaths.delete(excluded)) {
      throw new Error("The pinned Git tree does not match the repository-only allowlist.");
    }
  }
  for (const recovered of RECOVERED_ASSET_PATHS) {
    if (gitPaths.has(recovered)) {
      throw new Error("A recovered asset unexpectedly exists in the pinned Git tree.");
    }
    gitPaths.add(recovered);
  }
  return gitPaths;
}

function artifactFiles(artifactsRoot) {
  const rootStats = lstatSync(artifactsRoot);
  if (rootStats.isSymbolicLink() || !rootStats.isDirectory()) {
    throw new Error("The recovered artifact root is not a real directory.");
  }

  const files = new Set();
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const stats = lstatSync(absolute);
      if (stats.isSymbolicLink()) {
        throw new Error("The recovered artifact tree contains a symbolic link.");
      }
      if (stats.isDirectory()) {
        visit(absolute);
        continue;
      }
      if (!stats.isFile()) {
        throw new Error("The recovered artifact tree contains an unsupported entry.");
      }
      const path = relative(artifactsRoot, absolute).split("/").join(posix.sep);
      assertSafeRelativePath(path, "Recovered artifact path");
      files.add(path);
    }
  };
  visit(artifactsRoot);
  return files;
}

function readManifest(root) {
  const manifest = JSON.parse(readFileSync(join(root, "source-manifest.json"), "utf8"));
  if (manifest.deploymentId !== EXPECTED_DEPLOYMENT_ID || manifest.projectId !== EXPECTED_PROJECT_ID) {
    throw new Error("The recovery manifest identifies an unexpected deployment or project.");
  }
  if (manifest.sourceCommit !== EXPECTED_SOURCE_COMMIT) {
    throw new Error("The recovery manifest identifies an unexpected source commit.");
  }
  if (!Array.isArray(manifest.files)) {
    throw new Error("The recovery manifest files field is invalid.");
  }
  if (!Number.isInteger(manifest.sourceFiles) || manifest.sourceFiles !== manifest.files.length) {
    throw new Error("The recovery manifest sourceFiles count is inconsistent.");
  }

  const files = new Map();
  for (const file of manifest.files) {
    if (!file || typeof file !== "object") throw new Error("The recovery manifest contains an invalid file entry.");
    assertSafeRelativePath(file.path, "Manifest path");
    if (!/^[a-f0-9]{40}$/.test(file.sha1)) throw new Error("The recovery manifest contains an invalid SHA-1.");
    if (files.has(file.path)) throw new Error("The recovery manifest contains a duplicate path.");
    files.set(file.path, file.sha1);
  }
  return { manifest, files };
}

export function verifyRecovery(root = moduleRoot) {
  const { manifest, files } = readManifest(root);
  const expected = expectedSourcePaths(manifest.sourceCommit);
  if (expected.size !== EXPECTED_SOURCE_FILES || manifest.sourceFiles !== EXPECTED_SOURCE_FILES) {
    throw new Error("The recovery source-file total does not match the pinned baseline.");
  }
  assertSetEquality(new Set(files.keys()), expected, "The recovery manifest path set");

  const artifactsRoot = join(root, "artifacts");
  const artifacts = artifactFiles(artifactsRoot);
  assertSetEquality(artifacts, RECOVERED_ASSET_PATHS, "The recovered artifact path set");

  let failures = 0;
  for (const path of expected) {
    const expectedHash = files.get(path);
    try {
      const bytes = RECOVERED_ASSET_PATHS.has(path)
        ? readFileSync(join(artifactsRoot, path))
        : execFileSync("git", ["show", `${manifest.sourceCommit}:${path}`]);
      if (sha1(bytes) !== expectedHash) failures += 1;
    } catch {
      failures += 1;
    }
  }
  if (failures) throw new Error(`Vercel recovery verification failed: ${failures} source objects differ.`);
  return manifest.sourceFiles;
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  try {
    const count = verifyRecovery();
    console.log(`Vercel recovery verification passed: ${count} source objects.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Vercel recovery verification failed.");
    process.exit(1);
  }
}
