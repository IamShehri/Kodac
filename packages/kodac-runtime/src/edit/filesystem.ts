import { mkdir, readFile, realpath, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import { dirname, isAbsolute, relative, resolve, sep } from "node:path"

export class WorkspaceBoundaryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WorkspaceBoundaryError"
  }
}

export interface WorkspaceEntry {
  path: string
  type: "file" | "directory" | "symlink"
}

export interface WorkspaceSearchMatch {
  path: string
  line: number
  column: number
  preview: string
}

export interface WorkspaceFileSystem {
  readonly root: string
  exists(path: string): Promise<boolean>
  validatePath(path: string): Promise<void>
  readText(path: string): Promise<string>
  readTextBounded(path: string, maxBytes: number): Promise<string>
  list(path?: string, options?: { recursive?: boolean; maxEntries?: number; maxDepth?: number }): Promise<WorkspaceEntry[]>
  searchText(
    query: string,
    path?: string,
    options?: { caseSensitive?: boolean; maxResults?: number; maxEntries?: number; maxDepth?: number; maxFileBytes?: number },
  ): Promise<WorkspaceSearchMatch[]>
  writeText(path: string, content: string): Promise<void>
  remove(path: string): Promise<void>
  move(from: string, to: string): Promise<void>
}

function assertContained(root: string, candidate: string): void {
  const rel = relative(root, candidate)
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new WorkspaceBoundaryError(`Path escapes workspace: ${candidate}`)
  }
}

async function nearestExistingAncestor(path: string): Promise<string> {
  let current = path
  while (true) {
    try {
      await stat(current)
      return current
    } catch {
      const parent = dirname(current)
      if (parent === current) throw new WorkspaceBoundaryError(`No existing ancestor for path: ${path}`)
      current = parent
    }
  }
}

function positiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`)
}

function portableRelative(root: string, candidate: string): string {
  const rel = relative(root, candidate)
  return rel ? rel.split(sep).join("/") : "."
}

const DEFAULT_IGNORED_NAMES = new Set([".git", ".kodac", "node_modules"])

export class NodeWorkspaceFileSystem implements WorkspaceFileSystem {
  readonly root: string

  constructor(root: string) {
    this.root = resolve(root)
  }

  private async resolveWithin(path: string, allowRoot = false): Promise<string> {
    if ((!path && !allowRoot) || isAbsolute(path)) {
      throw new WorkspaceBoundaryError(`Workspace path must be relative: ${path}`)
    }

    const safePath = path || "."
    const lexicalRoot = resolve(this.root)
    const lexicalTarget = resolve(lexicalRoot, safePath)
    assertContained(lexicalRoot, lexicalTarget)

    const realRoot = await realpath(lexicalRoot)
    const ancestor = await nearestExistingAncestor(lexicalTarget)
    const realAncestor = await realpath(ancestor)
    assertContained(realRoot, realAncestor)

    try {
      const realTarget = await realpath(lexicalTarget)
      assertContained(realRoot, realTarget)
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== "ENOENT") throw error
    }

    return lexicalTarget
  }

  async validatePath(path: string): Promise<void> {
    await this.resolveWithin(path, path === ".")
  }

  async exists(path: string): Promise<boolean> {
    const target = await this.resolveWithin(path)
    try {
      await stat(target)
      return true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
      throw error
    }
  }

  async readText(path: string): Promise<string> {
    const target = await this.resolveWithin(path)
    return readFile(target, "utf8")
  }

  async readTextBounded(path: string, maxBytes: number): Promise<string> {
    positiveInteger("maxBytes", maxBytes)
    const target = await this.resolveWithin(path)
    const info = await stat(target)
    if (!info.isFile()) throw new Error(`Workspace path is not a file: ${path}`)
    if (info.size > maxBytes) throw new Error(`Workspace file exceeds ${maxBytes} byte read limit: ${path}`)
    return readFile(target, "utf8")
  }

  async list(
    path = ".",
    options: { recursive?: boolean; maxEntries?: number; maxDepth?: number } = {},
  ): Promise<WorkspaceEntry[]> {
    const recursive = options.recursive ?? true
    const maxEntries = options.maxEntries ?? 200
    const maxDepth = options.maxDepth ?? 4
    positiveInteger("maxEntries", maxEntries)
    positiveInteger("maxDepth", maxDepth)

    const target = await this.resolveWithin(path || ".", true)
    const targetInfo = await stat(target)
    if (!targetInfo.isDirectory()) throw new Error(`Workspace path is not a directory: ${path}`)

    const entries: WorkspaceEntry[] = []
    const walk = async (directory: string, depth: number): Promise<void> => {
      if (entries.length >= maxEntries) return
      const children = (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
      for (const child of children) {
        if (entries.length >= maxEntries) return
        if (DEFAULT_IGNORED_NAMES.has(child.name)) continue
        const childPath = resolve(directory, child.name)
        const portable = portableRelative(this.root, childPath)
        if (child.isSymbolicLink()) {
          entries.push({ path: portable, type: "symlink" })
          continue
        }
        if (child.isDirectory()) {
          entries.push({ path: portable, type: "directory" })
          if (recursive && depth < maxDepth) await walk(childPath, depth + 1)
          continue
        }
        if (child.isFile()) entries.push({ path: portable, type: "file" })
      }
    }

    await walk(target, 0)
    return entries
  }

  async searchText(
    query: string,
    path = ".",
    options: {
      caseSensitive?: boolean
      maxResults?: number
      maxEntries?: number
      maxDepth?: number
      maxFileBytes?: number
    } = {},
  ): Promise<WorkspaceSearchMatch[]> {
    if (!query) throw new Error("Search query must not be empty")
    const maxResults = options.maxResults ?? 50
    const maxEntries = options.maxEntries ?? 1000
    const maxDepth = options.maxDepth ?? 12
    const maxFileBytes = options.maxFileBytes ?? 256 * 1024
    positiveInteger("maxResults", maxResults)
    positiveInteger("maxEntries", maxEntries)
    positiveInteger("maxDepth", maxDepth)
    positiveInteger("maxFileBytes", maxFileBytes)

    const needle = options.caseSensitive ? query : query.toLowerCase()
    const matches: WorkspaceSearchMatch[] = []
    const entries = await this.list(path, { recursive: true, maxEntries, maxDepth })
    for (const entry of entries) {
      if (matches.length >= maxResults) break
      if (entry.type !== "file") continue
      const target = await this.resolveWithin(entry.path)
      const info = await stat(target)
      if (info.size > maxFileBytes) continue
      const content = await readFile(target, "utf8")
      if (content.includes("\u0000")) continue
      const lines = content.split(/\r?\n/)
      for (let index = 0; index < lines.length && matches.length < maxResults; index++) {
        const line = lines[index]
        const haystack = options.caseSensitive ? line : line.toLowerCase()
        const column = haystack.indexOf(needle)
        if (column < 0) continue
        matches.push({
          path: entry.path,
          line: index + 1,
          column: column + 1,
          preview: line.slice(0, 300),
        })
      }
    }
    return matches
  }

  async writeText(path: string, content: string): Promise<void> {
    const target = await this.resolveWithin(path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content, "utf8")
  }

  async remove(path: string): Promise<void> {
    const target = await this.resolveWithin(path)
    await rm(target)
  }

  async move(from: string, to: string): Promise<void> {
    const source = await this.resolveWithin(from)
    const destination = await this.resolveWithin(to)
    await mkdir(dirname(destination), { recursive: true })
    await rename(source, destination)
  }
}
