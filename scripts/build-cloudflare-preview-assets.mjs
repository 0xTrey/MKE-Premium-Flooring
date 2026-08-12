import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { verifyRecovery } from "../recovery/vercel-dpl_95Z1q8QmzTQd1j6SyGryFmfi6A1a/verify.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const recoveryRoot = join(repositoryRoot, "recovery/vercel-dpl_95Z1q8QmzTQd1j6SyGryFmfi6A1a");
const provenancePath = join(repositoryRoot, "cloudflare/preview-provenance.json");
const outputRoot = join(repositoryRoot, "dist/cloudflare-preview");
const outputPrefix = `${join(repositoryRoot, "dist")}/`;

const sha1 = (bytes) => createHash("sha1").update(bytes).digest("hex");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function gitShow(commit, path) {
  return execFileSync("git", ["show", `${commit}:${path}`], {
    cwd: repositoryRoot,
    maxBuffer: 16 * 1024 * 1024,
  });
}

function buildPublicIndex(sourceCommit, jsPath, cssPath) {
  const source = gitShow(sourceCommit, "client/index.html").toString("utf8");
  const entryTag = '    <script type="module" src="/src/main.tsx"></script>';
  const fontTag = '    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;500&display=swap" rel="stylesheet">';
  if (!source.includes(entryTag) || !source.includes(fontTag)) {
    throw new Error("The pinned client index no longer matches the recovered Vite entry contract.");
  }
  const builtTags = [
    `    <script type="module" crossorigin src="/${jsPath}"></script>`,
    `    <link rel="stylesheet" crossorigin href="/${cssPath}">`,
  ].join("\n");
  return Buffer.from(source.replace(fontTag, `${fontTag}\n${builtTags}`).replace(`\n${entryTag}`, ""));
}

function listFiles(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const stats = lstatSync(absolute);
      if (stats.isSymbolicLink() || (!stats.isDirectory() && !stats.isFile())) {
        throw new Error("The generated static tree contains an unsupported entry.");
      }
      if (stats.isDirectory()) visit(absolute);
      else files.push(relative(root, absolute).split("\\").join("/"));
    }
  };
  visit(root);
  return files.sort();
}

export function buildCloudflarePreviewAssets() {
  if (!outputRoot.startsWith(outputPrefix)) {
    throw new Error("Refusing to replace a static output directory outside repository dist.");
  }
  process.chdir(repositoryRoot);
  verifyRecovery(recoveryRoot);

  const provenance = JSON.parse(readFileSync(provenancePath, "utf8"));
  const sourceManifest = JSON.parse(readFileSync(join(repositoryRoot, provenance.sourceManifest), "utf8"));
  if (
    provenance.sourceCommit !== sourceManifest.sourceCommit ||
    provenance.vercelProjectId !== sourceManifest.projectId ||
    provenance.vercelDeploymentId !== sourceManifest.deploymentId
  ) {
    throw new Error("Cloudflare preview provenance differs from the immutable Vercel recovery record.");
  }

  const sourceFiles = sourceManifest.files.filter((file) => file.path.startsWith("dist/public/"));
  if (sourceFiles.length !== provenance.staticFiles) {
    throw new Error("The recovered static file count differs from Cloudflare preview provenance.");
  }

  const recovered = new Map(
    provenance.recoveredBundles.map((file) => [file.path, file]),
  );
  if (recovered.size !== 2) {
    throw new Error("The recovered bundle allowlist must contain exactly two files.");
  }

  const [jsPath] = [...recovered.keys()].filter((path) => path.endsWith(".js"));
  const [cssPath] = [...recovered.keys()].filter((path) => path.endsWith(".css"));
  if (!jsPath || !cssPath) {
    throw new Error("The recovered bundle allowlist must contain one JavaScript and one CSS file.");
  }

  rmSync(outputRoot, { recursive: true, force: true });
  mkdirSync(outputRoot, { recursive: true });

  for (const sourceFile of sourceFiles) {
    const publicPath = sourceFile.path.slice("dist/public/".length);
    let bytes;
    if (publicPath === provenance.publicIndex.path) {
      bytes = buildPublicIndex(provenance.sourceCommit, jsPath, cssPath);
      if (sha256(bytes) !== provenance.publicIndex.sha256) {
        throw new Error("The reconstructed public index differs from Vercel production.");
      }
    } else if (recovered.has(publicPath)) {
      bytes = readFileSync(join(recoveryRoot, "artifacts/dist/public", publicPath));
      if (sha256(bytes) !== recovered.get(publicPath).sha256) {
        throw new Error(`Recovered public bundle hash mismatch: ${publicPath}`);
      }
    } else {
      bytes = gitShow(provenance.sourceCommit, sourceFile.path);
    }

    if (publicPath !== provenance.publicIndex.path && sha1(bytes) !== sourceFile.sha1) {
      throw new Error(`Recovered static object hash mismatch: ${publicPath}`);
    }
    const destination = join(outputRoot, publicPath);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, bytes);
  }

  const expected = sourceFiles.map((file) => file.path.slice("dist/public/".length)).sort();
  const actual = listFiles(outputRoot);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("Generated Cloudflare static file set differs from the recovered production set.");
  }

  console.log(
    `Cloudflare preview static build passed: ${actual.length} files; index SHA-256 ${provenance.publicIndex.sha256}.`,
  );
  return { files: actual.length, indexSha256: provenance.publicIndex.sha256 };
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  try {
    buildCloudflarePreviewAssets();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Cloudflare preview static build failed.");
    process.exit(1);
  }
}
