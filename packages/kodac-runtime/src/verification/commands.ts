import { isAbsolute } from "node:path"
import type { VerificationCommandSpec, VerificationExecutable } from "./types.ts"

const CATEGORIES = new Set(["syntax", "types", "lint", "tests", "custom"])
const EXECUTABLES = new Set<VerificationExecutable>(["node", "npm", "pnpm", "yarn", "bun", "python", "cargo", "go"])

function boundedInteger(name: string, value: unknown, maximum: number): number | undefined {
  if (value === undefined) return undefined
  if (!Number.isInteger(value) || (value as number) <= 0 || (value as number) > maximum) {
    throw new Error(`${name} must be a positive integer <= ${maximum}`)
  }
  return value as number
}

function containsTraversal(value: string): boolean {
  return value === ".." || value.startsWith("../") || value.startsWith("..\\") || value.includes("/../") || value.includes("\\..\\")
}

export function parseVerificationCommandSpec(raw: string): VerificationCommandSpec {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch (error) {
    throw new Error("--verify-command must be valid JSON", { cause: error })
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("--verify-command must be a JSON object")
  const record = value as Record<string, unknown>
  const id = record.id
  const category = record.category
  const executable = record.executable
  const args = record.args
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(id)) throw new Error("verification command id is invalid")
  if (typeof category !== "string" || !CATEGORIES.has(category)) throw new Error("verification command category is invalid")
  if (typeof executable !== "string" || !EXECUTABLES.has(executable as VerificationExecutable)) {
    throw new Error("verification command executable is not in the Kodac safe executable catalog")
  }
  if (!Array.isArray(args) || args.length > 64 || !args.every((arg) => typeof arg === "string" && arg.length <= 4096 && !arg.includes("\0"))) {
    throw new Error("verification command args must be an array of bounded strings")
  }
  for (const arg of args) {
    if (typeof arg === "string" && (isAbsolute(arg) || containsTraversal(arg))) {
      throw new Error("verification command args must remain workspace-relative")
    }
  }
  return {
    id,
    category: category as VerificationCommandSpec["category"],
    executable: executable as VerificationExecutable,
    args: args as string[],
    timeoutMs: boundedInteger("verification timeoutMs", record.timeoutMs, 120_000),
    maxOutputBytes: boundedInteger("verification maxOutputBytes", record.maxOutputBytes, 1024 * 1024),
  }
}
