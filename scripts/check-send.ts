import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { findForbiddenLines, walkTextFiles } from "../src/check/neverDeny.js";

const root = process.cwd();
const problems: string[] = [];

const forbidden = findForbiddenLines(root);
if (forbidden.length > 0) {
  problems.push(`Decision wording outside the disclaimer:\n${forbidden.join("\n")}`);
}

const denylistFile = path.join(root, "send-denylist.txt");
if (!existsSync(denylistFile)) {
  problems.push("send-denylist.txt is missing. Copy send-denylist.example.txt and add employer terms.");
} else {
  const terms = readFileSync(denylistFile, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (terms.length === 0) {
    problems.push("send-denylist.txt has no terms. Add employer names, product names, and internal terms.");
  }
  const hits: string[] = [];
  walkTextFiles(root, (file) => {
    if (file.endsWith(`${path.sep}send-denylist.txt`)) return;
    const text = readFileSync(file, "utf8").toLowerCase();
    for (const term of terms) {
      if (text.includes(term.toLowerCase())) hits.push(`${path.relative(root, file)} contains "${term}"`);
    }
  });
  if (hits.length > 0) problems.push(hits.join("\n"));
}

const readme = existsSync(path.join(root, "README.md")) ? readFileSync(path.join(root, "README.md"), "utf8") : "";
for (const phrase of [
  "Independent personal project",
  "not affiliated with any company",
  "synthetic",
  "not clinical advice",
  "cms.gov",
]) {
  if (!readme.toLowerCase().includes(phrase.toLowerCase())) problems.push(`README is missing: ${phrase}`);
}

const policy = existsSync(path.join(root, "policy", "ncd-240-4.md"))
  ? readFileSync(path.join(root, "policy", "ncd-240-4.md"), "utf8")
  : "";
if (!policy.includes("https://www.cms.gov/medicare-coverage-database/view/ncd.aspx?NCDId=226")) {
  problems.push("Policy file is missing the NCD URL.");
}
if (!policy.includes("Nov 2, 2026")) problems.push("Policy file is missing the retrieval date.");

if (problems.length > 0) {
  console.error(problems.join("\n\n"));
  process.exit(1);
}
console.log("Send checklist passed.");
