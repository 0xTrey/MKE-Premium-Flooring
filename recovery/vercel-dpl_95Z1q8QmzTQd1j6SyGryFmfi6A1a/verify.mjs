import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "source-manifest.json"), "utf8"));
const sha1 = (bytes) => createHash("sha1").update(bytes).digest("hex");

let failures = 0;
for (const file of manifest.files) {
  const recovered = join(root, "artifacts", file.path);
  let bytes;
  try {
    bytes = existsSync(recovered)
      ? readFileSync(recovered)
      : execFileSync("git", ["show", `${manifest.sourceCommit}:${file.path}`]);
  } catch {
    failures += 1;
    continue;
  }
  if (sha1(bytes) !== file.sha1) failures += 1;
}

if (failures) {
  console.error(`Vercel recovery verification failed: ${failures} source objects differ.`);
  process.exit(1);
}
console.log(`Vercel recovery verification passed: ${manifest.files.length} source objects.`);
