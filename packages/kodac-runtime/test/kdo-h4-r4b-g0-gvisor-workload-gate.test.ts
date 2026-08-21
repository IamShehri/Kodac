import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

const gateSourcePath = fileURLToPath(new URL("../native/gvisor-workload-gate.c", import.meta.url))
const gateSource = readFileSync(gateSourcePath, "utf8")

function failOrSkip(t: { skip(message?: string): void }, message: string): false {
  if (process.env.GITHUB_ACTIONS === "true") assert.fail(message)
  t.skip(message)
  return false
}

function requireLinuxProofHost(t: { skip(message?: string): void }): boolean {
  if (process.platform !== "linux") {
    t.skip("H4-R4B-G0 static artifact proof is Linux-only")
    return false
  }
  for (const tool of ["cc", "readelf"] as const) {
    const probe = spawnSync(tool, [tool === "cc" ? "--version" : "--version"], { encoding: "utf8", shell: false })
    if (probe.status !== 0) return failOrSkip(t, `${tool} is required for H4-R4B-G0 proof: ${String(probe.error ?? probe.stderr)}`)
  }
  return true
}

function compile(root: string, outputName: string, sourceText: string, args: readonly string[]): string {
  const sourcePath = join(root, `${outputName}.c`)
  const outputPath = join(root, outputName)
  writeFileSync(sourcePath, sourceText, "utf8")
  const result = spawnSync("cc", [...args, sourcePath, "-o", outputPath], { encoding: "utf8", shell: false })
  assert.equal(result.status, 0, `${outputName} compile failed: ${String(result.error ?? result.stderr)}`)
  return outputPath
}

function compileGate(root: string): string {
  const outputPath = join(root, "kodac-gvisor-workload-gate")
  const result = spawnSync(
    "cc",
    ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", "-static", gateSourcePath, "-o", outputPath],
    { encoding: "utf8", shell: false },
  )
  assert.equal(result.status, 0, `static gate compile failed: ${String(result.error ?? result.stderr)}`)
  return outputPath
}

function runGate(
  gate: string,
  args: readonly string[],
  input: string,
  env: NodeJS.ProcessEnv = process.env,
): ReturnType<typeof spawnSync> {
  return spawnSync(gate, [...args], {
    input,
    encoding: "utf8",
    shell: false,
    env,
  })
}

function assertBlocked(result: ReturnType<typeof spawnSync>, label: string): void {
  assert.equal(result.status, 125, `${label}: expected fail-closed exit 125; stderr=${String(result.stderr)}`)
  assert.equal(result.stdout, "", `${label}: gate must emit zero stdout bytes before target exec`)
  assert.equal(result.stderr, "", `${label}: gate must emit zero stderr bytes before target exec`)
}

function nulFields(path: string): readonly string[] {
  const bytes = readFileSync(path)
  assert.equal(bytes.at(-1), 0, "argv witness must terminate each field with NUL")
  return Object.freeze(bytes.subarray(0, bytes.byteLength - 1).toString("utf8").split("\0"))
}

const targetFixture = String.raw`
#include <errno.h>
#include <fcntl.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static int write_all(int fd, const void *buffer, size_t length) {
  const char *bytes = (const char *)buffer;
  size_t offset = 0;
  while (offset < length) {
    ssize_t count = write(fd, bytes + offset, length - offset);
    if (count < 0) {
      if (errno == EINTR) continue;
      return -1;
    }
    if (count == 0) return -1;
    offset += (size_t)count;
  }
  return 0;
}

int main(int argc, char **argv) {
  char byte = 0;
  errno = 0;
  if (read(STDIN_FILENO, &byte, 1) != -1 || errno != EBADF) return 71;

  const char *witness = getenv("KODAC_G0_ARGV_WITNESS");
  if (witness == NULL || witness[0] == '\0') return 72;
  int fd = open(witness, O_WRONLY | O_CREAT | O_TRUNC, 0600);
  if (fd < 0) return 73;
  for (int i = 0; i < argc; ++i) {
    if (write_all(fd, argv[i], strlen(argv[i])) != 0 || write_all(fd, "\0", 1) != 0) {
      close(fd);
      return 74;
    }
  }
  if (close(fd) != 0) return 75;
  if (write_all(STDOUT_FILENO, "TARGET_STDOUT", 13) != 0) return 76;
  if (write_all(STDERR_FILENO, "TARGET_STDERR", 13) != 0) return 77;
  return 0;
}
`

const preloadFixture = String.raw`
#include <errno.h>
#include <fcntl.h>
#include <stdlib.h>
#include <unistd.h>

__attribute__((constructor)) static void before_main(void) {
  const char *witness = getenv("KODAC_G0_PRELOAD_WITNESS");
  if (witness == NULL || witness[0] == '\0') return;
  int fd = open(witness, O_WRONLY | O_CREAT | O_TRUNC, 0600);
  if (fd < 0) return;
  const char marker[] = "PREMAIN";
  size_t offset = 0;
  while (offset < sizeof marker - 1) {
    ssize_t count = write(fd, marker + offset, sizeof marker - 1 - offset);
    if (count < 0) {
      if (errno == EINTR) continue;
      break;
    }
    if (count == 0) break;
    offset += (size_t)count;
  }
  (void)close(fd);
}
`

test("H4-R4B-G0 source stays within the minimal gate authority", () => {
  assert.match(gateSource, /SPDX-License-Identifier: Apache-2\.0/)
  assert.match(gateSource, /#define KODAC_GATE_FAILURE_EXIT 125/)
  assert.match(gateSource, /#define KODAC_GATE_PERMIT_MAX_BYTES 4/)
  assert.match(gateSource, /read\(STDIN_FILENO,/)
  assert.match(gateSource, /close\(STDIN_FILENO\)/)
  assert.match(gateSource, /execv\(argv\[1\], &argv\[1\]\)/)
  assert.match(gateSource, /argv\[1\]\[0\] != '\/'/)

  const forbiddenCalls = /\b(?:socket|connect|bind|listen|accept|send|recv|fork|clone|posix_spawn|system|popen|mount|umount|setns|unshare|ptrace|getenv|setenv|putenv|execvp|execlp|execvpe|sleep|usleep|nanosleep)\s*\(/
  assert.doesNotMatch(gateSource, forbiddenCalls)
  assert.doesNotMatch(gateSource, /\b(?:printf|fprintf|fputs|puts|perror|write)\s*\(/)
  assert.doesNotMatch(gateSource, /\b(?:LD_PRELOAD|LD_LIBRARY_PATH)\b/)
})

test("H4-R4B-G0 gate is static, fail-closed, exact-argv, closed-stdin, and loader-hostile", (t) => {
  if (!requireLinuxProofHost(t)) return

  const root = mkdtempSync(join(tmpdir(), "kodac-r4b-g0-"))
  try {
    const gate = compileGate(root)
    const target = compile(root, "target-fixture", targetFixture, ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror"])

    const preloadSource = join(root, "preload-fixture.c")
    const preload = join(root, "preload-fixture.so")
    writeFileSync(preloadSource, preloadFixture, "utf8")
    const preloadBuild = spawnSync(
      "cc",
      ["-shared", "-fPIC", "-O2", "-Wall", "-Wextra", "-Werror", preloadSource, "-o", preload],
      { encoding: "utf8", shell: false },
    )
    assert.equal(preloadBuild.status, 0, `preload fixture compile failed: ${String(preloadBuild.error ?? preloadBuild.stderr)}`)

    const headers = spawnSync("readelf", ["-h", gate], { encoding: "utf8", shell: false })
    assert.equal(headers.status, 0, `readelf -h failed: ${String(headers.error ?? headers.stderr)}`)
    assert.match(String(headers.stdout), /ELF Header:/)

    const programHeaders = spawnSync("readelf", ["-l", gate], { encoding: "utf8", shell: false })
    assert.equal(programHeaders.status, 0, `readelf -l failed: ${String(programHeaders.error ?? programHeaders.stderr)}`)
    assert.doesNotMatch(String(programHeaders.stdout), /\bINTERP\b/)
    assert.doesNotMatch(String(programHeaders.stdout), /Requesting program interpreter/)

    const dynamic = spawnSync("readelf", ["-d", gate], { encoding: "utf8", shell: false })
    assert.equal(dynamic.status, 0, `readelf -d failed: ${String(dynamic.error ?? dynamic.stderr)}`)
    assert.doesNotMatch(`${String(dynamic.stdout)}${String(dynamic.stderr)}`, /\bNEEDED\b/)

    const missing = runGate(gate, [], "GO\n")
    assertBlocked(missing, "missing deferred target")

    const relative = runGate(gate, ["relative-target"], "GO\n")
    assertBlocked(relative, "relative deferred target")

    for (const [label, input] of [
      ["EOF with zero bytes", ""],
      ["one-byte prefix", "G"],
      ["two-byte prefix", "GO"],
      ["wrong permit", "NO\n"],
      ["CR framing", "GO\r"],
      ["extra permit byte", "GO\nX"],
    ] as const) {
      assertBlocked(runGate(gate, [target], input), label)
    }

    const argvWitness = join(root, "argv.witness")
    const preloadWitness = join(root, "preload.witness")
    const hostileEnv = {
      ...process.env,
      LD_PRELOAD: preload,
      LD_LIBRARY_PATH: root,
      KODAC_G0_ARGV_WITNESS: argvWitness,
      KODAC_G0_PRELOAD_WITNESS: preloadWitness,
    }

    const preGo = runGate(gate, [target, "arg one", "--flag=two", "$HOME", "*"], "NO\n", hostileEnv)
    assertBlocked(preGo, "hostile loader environment before GO")
    assert.equal(existsSync(preloadWitness), false, "LD_PRELOAD constructor must not run in the static gate before valid GO")
    assert.equal(existsSync(argvWitness), false, "deferred target must not run before valid GO")

    const successArgs = [target, "arg one", "--flag=two", "$HOME", "*"] as const
    const success = runGate(gate, successArgs, "GO\n", hostileEnv)
    assert.equal(success.status, 0, `valid permit target failed: ${String(success.error ?? success.stderr)}`)
    assert.equal(success.stdout, "TARGET_STDOUT", "gate must contribute zero stdout before target exec")
    assert.equal(success.stderr, "TARGET_STDERR", "gate must contribute zero stderr before target exec")
    assert.deepEqual(nulFields(argvWitness), successArgs)
    assert.equal(readFileSync(preloadWitness, "utf8"), "PREMAIN", "workload environment must remain intact after GO")
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
