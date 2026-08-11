/*
 * Adapted from OpenCode packages/opencode/src/patch/index.ts at
 * 3a90639cb57619a21e59f544b3e8d23ffed56f48 (MIT).
 * Copyright (c) 2025 opencode.
 * See ../../THIRD_PARTY_NOTICES.md for the complete MIT notice and Kodac modifications.
 */

import type { WorkspaceFileSystem } from "./filesystem.ts"

export type Hunk =
  | { type: "add"; path: string; contents: string }
  | { type: "delete"; path: string }
  | { type: "update"; path: string; movePath?: string; chunks: UpdateFileChunk[] }

export interface UpdateFileChunk {
  oldLines: string[]
  newLines: string[]
  changeContext?: string
  isEndOfFile?: boolean
}

export interface AffectedPaths {
  added: string[]
  modified: string[]
  deleted: string[]
}

export class PatchFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PatchFormatError"
  }
}

function parsePatchHeader(
  lines: string[],
  start: number,
): { kind: Hunk["type"]; path: string; movePath?: string; next: number } | null {
  const line = lines[start]
  const forms: Array<[string, Hunk["type"]]> = [
    ["*** Add File:", "add"],
    ["*** Delete File:", "delete"],
    ["*** Update File:", "update"],
  ]
  for (const [prefix, kind] of forms) {
    if (!line.startsWith(prefix)) continue
    const filePath = line.slice(prefix.length).trim()
    if (!filePath) throw new PatchFormatError(`${prefix} requires a path`)
    let next = start + 1
    let movePath: string | undefined
    if (kind === "update" && next < lines.length && lines[next].startsWith("*** Move to:")) {
      movePath = lines[next].slice("*** Move to:".length).trim()
      if (!movePath) throw new PatchFormatError("*** Move to: requires a path")
      next += 1
    }
    return { kind, path: filePath, movePath, next }
  }
  return null
}

function parseAddFileContent(lines: string[], start: number): { content: string; next: number } {
  const content: string[] = []
  let index = start
  while (index < lines.length && !lines[index].startsWith("***")) {
    const line = lines[index]
    if (!line.startsWith("+")) {
      throw new PatchFormatError(`Add-file content must start with '+': ${line}`)
    }
    content.push(line.slice(1))
    index += 1
  }
  return { content: content.join("\n"), next: index }
}

function parseUpdateChunks(lines: string[], start: number): { chunks: UpdateFileChunk[]; next: number } {
  const chunks: UpdateFileChunk[] = []
  let index = start
  while (index < lines.length && !lines[index].startsWith("***")) {
    if (!lines[index].startsWith("@@")) {
      if (lines[index].trim() === "") {
        index += 1
        continue
      }
      throw new PatchFormatError(`Update chunk must start with '@@': ${lines[index]}`)
    }

    const changeContext = lines[index].slice(2).trim() || undefined
    index += 1
    const oldLines: string[] = []
    const newLines: string[] = []
    let isEndOfFile = false

    while (index < lines.length && !lines[index].startsWith("@@") && !lines[index].startsWith("***")) {
      const line = lines[index]
      if (line === "*** End of File") {
        isEndOfFile = true
        index += 1
        break
      }
      if (line.startsWith(" ")) {
        oldLines.push(line.slice(1))
        newLines.push(line.slice(1))
      } else if (line.startsWith("-")) {
        oldLines.push(line.slice(1))
      } else if (line.startsWith("+")) {
        newLines.push(line.slice(1))
      } else {
        throw new PatchFormatError(`Malformed update line: ${line}`)
      }
      index += 1
    }

    if (oldLines.length === 0 && newLines.length === 0) {
      throw new PatchFormatError("Update chunk contains no change")
    }
    chunks.push({ oldLines, newLines, changeContext, isEndOfFile: isEndOfFile || undefined })
  }
  return { chunks, next: index }
}

function stripHeredoc(input: string): string {
  const match = input.match(/^(?:cat\s+)?<<['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1\s*$/)
  return match ? match[2] : input
}

export function parsePatch(patchText: string): { hunks: Hunk[] } {
  const lines = stripHeredoc(patchText.trim()).split("\n")
  const begin = lines.findIndex((line) => line.trim() === "*** Begin Patch")
  const end = lines.findIndex((line) => line.trim() === "*** End Patch")
  if (begin === -1 || end === -1 || begin >= end) {
    throw new PatchFormatError("Invalid patch format: missing Begin/End markers")
  }

  const hunks: Hunk[] = []
  let index = begin + 1
  while (index < end) {
    if (lines[index].trim() === "") {
      index += 1
      continue
    }
    const header = parsePatchHeader(lines, index)
    if (!header) throw new PatchFormatError(`Unexpected patch directive: ${lines[index]}`)

    if (header.kind === "add") {
      const parsed = parseAddFileContent(lines, header.next)
      hunks.push({ type: "add", path: header.path, contents: parsed.content })
      index = parsed.next
      continue
    }
    if (header.kind === "delete") {
      hunks.push({ type: "delete", path: header.path })
      index = header.next
      continue
    }

    const parsed = parseUpdateChunks(lines, header.next)
    if (parsed.chunks.length === 0) throw new PatchFormatError(`Update for ${header.path} contains no chunks`)
    hunks.push({ type: "update", path: header.path, movePath: header.movePath, chunks: parsed.chunks })
    index = parsed.next
  }

  if (hunks.length === 0) throw new PatchFormatError("Patch contains no file operations")
  return { hunks }
}

function splitBom(text: string): { bom: boolean; text: string } {
  const bom = text.charCodeAt(0) === 0xfeff
  return { bom, text: bom ? text.slice(1) : text }
}

function joinBom(text: string, bom: boolean): string {
  const stripped = splitBom(text).text
  return bom ? `\ufeff${stripped}` : stripped
}

function normalizeUnicode(value: string): string {
  return value
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
}

type Comparator = (left: string, right: string) => boolean

function tryMatch(lines: string[], pattern: string[], start: number, compare: Comparator, eof: boolean): number {
  if (eof) {
    const fromEnd = lines.length - pattern.length
    if (fromEnd >= start && pattern.every((value, offset) => compare(lines[fromEnd + offset], value))) {
      return fromEnd
    }
  }
  for (let index = start; index <= lines.length - pattern.length; index += 1) {
    if (pattern.every((value, offset) => compare(lines[index + offset], value))) return index
  }
  return -1
}

function seekSequence(lines: string[], pattern: string[], start: number, eof = false): number {
  if (pattern.length === 0) return -1
  const comparators: Comparator[] = [
    (a, b) => a === b,
    (a, b) => a.trimEnd() === b.trimEnd(),
    (a, b) => a.trim() === b.trim(),
    (a, b) => normalizeUnicode(a.trim()) === normalizeUnicode(b.trim()),
  ]
  for (const compare of comparators) {
    const found = tryMatch(lines, pattern, start, compare, eof)
    if (found !== -1) return found
  }
  return -1
}

function applyReplacements(lines: string[], replacements: Array<[number, number, string[]]>): string[] {
  const result = [...lines]
  for (const [start, oldLength, next] of [...replacements].sort((a, b) => b[0] - a[0])) {
    result.splice(start, oldLength, ...next)
  }
  return result
}

function computeReplacements(
  originalLines: string[],
  filePath: string,
  chunks: UpdateFileChunk[],
): Array<[number, number, string[]]> {
  const replacements: Array<[number, number, string[]]> = []
  let lineIndex = 0

  for (const chunk of chunks) {
    if (chunk.changeContext) {
      const context = seekSequence(originalLines, [chunk.changeContext], lineIndex)
      if (context === -1) throw new Error(`Failed to find context '${chunk.changeContext}' in ${filePath}`)
      lineIndex = context + 1
    }

    if (chunk.oldLines.length === 0) {
      const insertion = chunk.changeContext ? lineIndex : originalLines.length
      replacements.push([insertion, 0, chunk.newLines])
      lineIndex = insertion
      continue
    }

    let pattern = chunk.oldLines
    let replacement = chunk.newLines
    let found = seekSequence(originalLines, pattern, lineIndex, chunk.isEndOfFile)
    if (found === -1 && pattern.at(-1) === "") {
      pattern = pattern.slice(0, -1)
      if (replacement.at(-1) === "") replacement = replacement.slice(0, -1)
      found = seekSequence(originalLines, pattern, lineIndex, chunk.isEndOfFile)
    }
    if (found === -1) {
      throw new Error(`Failed to find expected lines in ${filePath}:\n${chunk.oldLines.join("\n")}`)
    }
    replacements.push([found, pattern.length, replacement])
    lineIndex = found + pattern.length
  }

  return replacements.sort((a, b) => a[0] - b[0])
}

export function deriveNewContentsFromChunks(
  filePath: string,
  chunks: UpdateFileChunk[],
  originalText: string,
): { content: string; bom: boolean } {
  const original = splitBom(originalText)
  const hadTrailingNewline = original.text.endsWith("\n")
  const originalLines = original.text.split("\n")
  if (hadTrailingNewline) originalLines.pop()
  const replacements = computeReplacements(originalLines, filePath, chunks)
  const nextLines = applyReplacements(originalLines, replacements)
  const next = `${nextLines.join("\n")}\n`
  return { content: next, bom: original.bom }
}

function hunkPaths(hunk: Hunk): string[] {
  return hunk.type === "update" && hunk.movePath ? [hunk.path, hunk.movePath] : [hunk.path]
}

export async function applyHunks(fs: WorkspaceFileSystem, hunks: Hunk[]): Promise<AffectedPaths> {
  if (hunks.length === 0) throw new Error("No files were modified")

  const touched = new Set<string>()
  for (const hunk of hunks) {
    for (const path of hunkPaths(hunk)) {
      if (touched.has(path)) throw new Error(`Patch touches the same path more than once: ${path}`)
      touched.add(path)
    }
  }

  const result: AffectedPaths = { added: [], modified: [], deleted: [] }
  for (const hunk of hunks) {
    if (hunk.type === "add") {
      if (await fs.exists(hunk.path)) throw new Error(`Add target already exists: ${hunk.path}`)
      await fs.writeText(hunk.path, hunk.contents)
      result.added.push(hunk.path)
      continue
    }

    if (hunk.type === "delete") {
      await fs.readText(hunk.path)
      await fs.remove(hunk.path)
      result.deleted.push(hunk.path)
      continue
    }

    const originalText = await fs.readText(hunk.path)
    const update = deriveNewContentsFromChunks(hunk.path, hunk.chunks, originalText)
    const content = joinBom(update.content, update.bom)
    if (hunk.movePath) {
      if (await fs.exists(hunk.movePath)) throw new Error(`Move target already exists: ${hunk.movePath}`)
      await fs.writeText(hunk.movePath, content)
      await fs.remove(hunk.path)
      result.modified.push(hunk.movePath)
    } else {
      await fs.writeText(hunk.path, content)
      result.modified.push(hunk.path)
    }
  }
  return result
}

export async function applyPatch(fs: WorkspaceFileSystem, patchText: string): Promise<AffectedPaths> {
  return applyHunks(fs, parsePatch(patchText).hunks)
}
