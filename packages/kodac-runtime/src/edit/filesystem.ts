import { mkdir, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises"
import { dirname, isAbsolute, relative, resolve, sep } from "node:path"

export class WorkspaceBoundaryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WorkspaceBoundaryError"
  }
}

export interface WorkspaceFileSystem {
  readonly root: string
  exists(path: string): Promise<boolean>
  readText(path: string): Promise<string>
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

export class NodeWorkspaceFileSystem implements WorkspaceFileSystem {
  readonly root: string

  constructor(root: string) {
    this.root = resolve(root)
  }

  private async resolveWithin(path: string): Promise<string> {
    if (!path || isAbsolute(path)) {
      throw new WorkspaceBoundaryError(`Workspace path must be relative: ${path}`)
    }

    const lexicalRoot = resolve(this.root)
    const lexicalTarget = resolve(lexicalRoot, path)
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
