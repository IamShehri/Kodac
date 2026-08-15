import assert from "node:assert/strict"
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { ExecutionBlockedError, ExecutionGateway } from "../src/execution/gateway.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import { fixedPolicy } from "../src/trust/policy.ts"
import {
  createSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "../src/trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3E_BINDING_REQUEST_VERSION,
  KDO_H4_R3E_BINDING_VERSION,
  KDO_H4_R3E_EVIDENCE_CLASS,
  KDO_H4_R3E_HELPER_FD,
  KDO_H4_R3E_LINEAGE_VERSION,
  KDO_H4_R3E_RUNSC_FD,
  KDO_H4_R3E_RUNTIME_CONFIG_VERSION,
  createGvisorContainerBinding,
  createGvisorContainerBindingRequest,
  createGvisorExecutionAttemptIdentity,
  createGvisorRuntimeLineageCommit,
  validateGvisorContainerBinding,
  validateGvisorObserverRuntimeConfig,
  validateGvisorRuntimeLineageRecord,
  type GvisorRuntimeLineageRecord,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"

const CONTAINER_ID = "1".repeat(64)
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")

function sha256File(path: string): string { return createHash("sha256").update(readFileSync(path)).digest("hex") }
function gitBlobSha1(text: string): string { const body = Buffer.from(text.replace(/\r\n/g, "\n"), "utf8"); return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex") }
function cString(value: string): string { return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"') }
function compileC(root: string, name: string, text: string): string {
  const sourcePath = join(root, `${name}.c`); const binary = join(root, name); writeFileSync(sourcePath, text, "utf8")
  const compile = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", sourcePath, "-o", binary], { encoding: "utf8", shell: false })
  assert.equal(compile.status, 0, `${name} compile failed: ${String(compile.stderr)}`); return binary
}
function compileObserverHelper(root: string): string {
  const nativePath = fileURLToPath(new URL("../native/gvisor-proc-observe.c", import.meta.url)); const binary = join(root, "kodac-gvisor-proc-observe")
  const compile = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", nativePath, "-o", binary], { encoding: "utf8", shell: false })
  assert.equal(compile.status, 0, `gvisor helper compile failed: ${String(compile.stderr)}`); return binary
}
function fixtureRequirement(runtime: "gvisor" | "kata-qemu" = "gvisor"): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({ mode: "read-only", workspaceIdentity: WORKSPACE_IDENTITY, executionIntentIdentity: EXECUTION_INTENT_IDENTITY, scope: { readPaths: ["src"], writePaths: [] } })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3e-fixture", digest: `sha256:${"2".repeat(64)}` }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes: 1048576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: runtime })
}

function compileFakeRunsc(root: string, runscPath: string, helperPath: string, runtimeRoot: string): string {
  const movedRunsc = `${runscPath}.moved`; const movedHelper = `${helperPath}.moved`; const marker = join(runtimeRoot, "renamed"); const pidFile = join(runtimeRoot, "sandbox.pid"); const logFile = join(runtimeRoot, "invocations.log")
  return compileC(root, "fake-runsc", `#define _GNU_SOURCE\n#include <errno.h>\n#include <fcntl.h>\n#include <signal.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <sys/stat.h>\n#include <sys/types.h>\n#include <unistd.h>\n\nstatic const char *RUNSC = "${cString(runscPath)}";\nstatic const char *RUNSC_MOVED = "${cString(movedRunsc)}";\nstatic const char *HELPER = "${cString(helperPath)}";\nstatic const char *HELPER_MOVED = "${cString(movedHelper)}";\nstatic const char *MARKER = "${cString(marker)}";\nstatic const char *PIDFILE = "${cString(pidFile)}";\nstatic const char *LOGFILE = "${cString(logFile)}";\n\nstatic int write_pid(const char *path) { FILE *f=fopen(path,"w"); if(!f) return 125; if(fprintf(f,"%ld\\n",(long)getpid())<0){fclose(f);return 125;} return fclose(f)==0?0:125; }\nstatic long read_pid(void) { FILE *f=fopen(PIDFILE,"r"); long p=0; if(!f) return 0; if(fscanf(f,"%ld",&p)!=1) p=0; fclose(f); return p; }\nstatic void log_argv0(const char *v) { FILE *f=fopen(LOGFILE,"a"); if(f){fprintf(f,"%s\\n",v);fclose(f);} }\nstatic void rename_once(void) { struct stat st; if(stat(MARKER,&st)==0) return; if(rename(RUNSC,RUNSC_MOVED)!=0) _exit(121); if(rename(HELPER,HELPER_MOVED)!=0) _exit(122); int fd=open(MARKER,O_WRONLY|O_CREAT|O_EXCL,0600); if(fd<0) _exit(123); close(fd); }\nint main(int argc,char **argv){\n  if(argc==3 && strcmp(argv[1],"sandbox")==0){ if(write_pid(argv[2])!=0) return 125; for(;;) pause(); }\n  if(argc>=5 && strcmp(argv[1],"--root")==0){ log_argv0(argv[0]); if(strcmp(argv[3],"state")==0 && argc==5){ rename_once(); long p=read_pid(); if(p<=0) return 125; printf("{\\\"ociVersion\\\":\\\"1.2.0\\\",\\\"id\\\":\\\"%s\\\",\\\"status\\\":\\\"running\\\",\\\"pid\\\":%ld,\\\"bundle\\\":\\\"/run/kodac/%s\\\"}\\n",argv[4],p,argv[4]); return 0; } if(strcmp(argv[3],"events")==0 && argc==6 && strcmp(argv[4],"--stats")==0){ printf("{\\\"type\\\":\\\"stats\\\",\\\"id\\\":\\\"%s\\\",\\\"data\\\":{\\\"cpu\\\":{\\\"usage\\\":1}}}\\n",argv[5]); return 0; } }\n  return 125;\n}\n`)
}

async function waitForFile(path: string): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) { if (existsSync(path)) return; await new Promise<void>((resolvePromise) => setTimeout(resolvePromise, 10)) }
  throw new Error(`fixture file did not appear: ${path}`)
}

function createRuntime(runscPath: string, helperPath: string, runtimeRoot: string, onCommit?: (record: GvisorRuntimeLineageRecord) => unknown) {
  return validateGvisorObserverRuntimeConfig({
    version: KDO_H4_R3E_RUNTIME_CONFIG_VERSION,
    runscPath,
    expectedRunscSha256: sha256File(runscPath),
    observerHelperPath: helperPath,
    expectedObserverHelperSha256: sha256File(helperPath),
    runtimeRoot,
    resolveContainerBinding(request) {
      return createGvisorContainerBinding({ providerId: "fixture-r3e", executionAttemptIdentity: request.executionAttemptIdentity, requirementIdentity: request.requirementIdentity, workloadIdentity: request.workloadIdentity, containerId: CONTAINER_ID })
    },
    commitLineageEvidence(record) { const override = onCommit?.(record); return override ?? createGvisorRuntimeLineageCommit(record) },
  })
}

test("H4-R3E pure binding contracts are strict caller-independent and E2-only", () => {
  assert.equal(KDO_H4_R3E_BINDING_REQUEST_VERSION, "kodac-h4-r3e-container-binding-request-v1")
  assert.equal(KDO_H4_R3E_BINDING_VERSION, "kodac-h4-r3e-container-binding-v1")
  assert.equal(KDO_H4_R3E_LINEAGE_VERSION, "kodac-h4-r3e-gvisor-runtime-lineage-v1")
  assert.equal(KDO_H4_R3E_EVIDENCE_CLASS, "e3-integrated-runtime-lineage")
  assert.equal(KDO_H4_R3E_RUNSC_FD, 3); assert.equal(KDO_H4_R3E_HELPER_FD, 4)
  const requirement = fixtureRequirement(); const attempt = createGvisorExecutionAttemptIdentity({ requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, nonce: "123e4567-e89b-42d3-a456-426614174000" }); const request = createGvisorContainerBindingRequest({ executionAttemptIdentity: attempt, requirement })
  assert.deepEqual(Object.keys(request).sort(), ["bindingRequestIdentity", "executionAttemptIdentity", "requirementIdentity", "version", "workloadIdentity"])
  assert.equal("containerId" in request, false)
  const binding = createGvisorContainerBinding({ providerId: "fixture-r3e", executionAttemptIdentity: attempt, requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, containerId: CONTAINER_ID })
  assert.deepEqual(validateGvisorContainerBinding(binding, request), binding)
  for (const bad of [{ ...binding, containerId: CONTAINER_ID.slice(0, 12) }, { ...binding, requirementIdentity: "f".repeat(64) }, { ...binding, observedNetworkPolicy: {} }]) assert.throws(() => validateGvisorContainerBinding(bad, request))
  assert.throws(() => createGvisorContainerBindingRequest({ executionAttemptIdentity: attempt, requirement: fixtureRequirement("kata-qemu") }), /gvisor/)
})

test("H4-R3E production surfaces preserve R3D bytes and cannot mint R3B physical evidence", () => {
  assert.equal(gitBlobSha1(source("../native/gvisor-proc-observe.c")), "277b66c83ad82c96aa7dbd71f941daf8c6627738")
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-observer-gvisor.ts")), "47c792ba01c9ba4b2db94d7558f282cdbd218660")
  const runtimeSource = source("../src/trust/sandbox-observer-gvisor-runtime.ts"); const gatewaySource = source("../src/execution/gateway.ts")
  assert.doesNotMatch(runtimeSource, /createSandboxBackendObservation|createSandboxExecutionEvidence|dockerode|Docker|containerd|node:net|node:http|node:https/)
  assert.doesNotMatch(gatewaySource, /createSandboxBackendObservation|createSandboxExecutionEvidence|dockerode|node:net|node:http|node:https/)
  assert.match(gatewaySource, /\/proc\/self\/fd\/\$\{options\.executableFd\}/)
})

test("H4-R3E runtime config rejects caller-selected or exotic authority", () => {
  const base = { version: KDO_H4_R3E_RUNTIME_CONFIG_VERSION, runscPath: "/opt/runsc", expectedRunscSha256: "a".repeat(64), observerHelperPath: "/opt/kodac-helper", expectedObserverHelperSha256: "b".repeat(64), runtimeRoot: "/run/runsc", resolveContainerBinding: () => ({}), commitLineageEvidence: () => ({}) }
  assert.doesNotThrow(() => validateGvisorObserverRuntimeConfig(base))
  assert.throws(() => validateGvisorObserverRuntimeConfig({ ...base, dockerSocket: "/var/run/docker.sock" }))
  assert.throws(() => validateGvisorObserverRuntimeConfig({ ...base, runscPath: "runsc" }))
  assert.throws(() => validateGvisorObserverRuntimeConfig(new Proxy(base, {})))
})

test("H4-R3E ask stays blocked before trusted observer activity", async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3e-ask-")); const workspace = join(root, "workspace"); mkdirSync(workspace)
  try {
    let resolverCalls = 0
    const runtime = validateGvisorObserverRuntimeConfig({ version: KDO_H4_R3E_RUNTIME_CONFIG_VERSION, runscPath: "/does/not/matter/runsc", expectedRunscSha256: "a".repeat(64), observerHelperPath: "/does/not/matter/helper", expectedObserverHelperSha256: "b".repeat(64), runtimeRoot: "/run/runsc", resolveContainerBinding: () => { resolverCalls += 1; return {} }, commitLineageEvidence: () => ({}) })
    const gateway = new ExecutionGateway(new NodeWorkspaceFileSystem(workspace), fixedPolicy("ask"), undefined, undefined, runtime)
    await assert.rejects(gateway.observeGvisorRuntimeInstance(fixtureRequirement()), ExecutionBlockedError); assert.equal(resolverCalls, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("H4-R3E Linux K2 proof executes retained runsc/helper FDs after paths are renamed", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3e-live-")); const runtimeRoot = join(root, "runsc-root"); const workspace = join(root, "workspace"); mkdirSync(runtimeRoot); mkdirSync(workspace)
  const runscPath = join(root, "fake-runsc"); const helperPath = join(root, "kodac-gvisor-proc-observe"); let sandbox: ChildProcess | undefined
  try {
    compileObserverHelper(root); compileFakeRunsc(root, runscPath, helperPath, runtimeRoot)
    const pidFile = join(runtimeRoot, "sandbox.pid"); sandbox = spawn(runscPath, ["sandbox", pidFile], { stdio: "ignore", shell: false }); await waitForFile(pidFile)
    let committed: GvisorRuntimeLineageRecord | undefined
    const gateway = new ExecutionGateway(new NodeWorkspaceFileSystem(workspace), fixedPolicy("allow"), undefined, undefined, createRuntime(runscPath, helperPath, runtimeRoot, (record) => { committed = record; return createGvisorRuntimeLineageCommit(record) }))
    const record = await gateway.observeGvisorRuntimeInstance(fixtureRequirement())
    assert.equal(record.evidenceClass, KDO_H4_R3E_EVIDENCE_CLASS); assert.equal(record.containerId, CONTAINER_ID); assert.deepEqual(validateGvisorRuntimeLineageRecord(record), record); assert.equal(committed?.recordIdentity, record.recordIdentity)
    assert.equal(existsSync(runscPath), false); assert.equal(existsSync(helperPath), false); assert.equal(existsSync(`${runscPath}.moved`), true); assert.equal(existsSync(`${helperPath}.moved`), true)
    const invocations = readFileSync(join(runtimeRoot, "invocations.log"), "utf8").trim().split(/\r?\n/); assert.deepEqual(invocations, ["/proc/self/fd/3", "/proc/self/fd/3", "/proc/self/fd/3"])
    for (const forbidden of ["observedSourceDigest", "observedNetworkPolicy", "observedResourcePolicy", "observedCredentialBindingIdentity", "downgradeOccurred", "observationIdentity", "evidenceIdentity"]) assert.equal(forbidden in record, false)
  } finally { if (sandbox && sandbox.exitCode === null && sandbox.signalCode === null) sandbox.kill("SIGKILL"); rmSync(root, { recursive: true, force: true }) }
})

test("H4-R3E wrong durable acknowledgment prevents successful return", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3e-ack-")); const runtimeRoot = join(root, "runsc-root"); const workspace = join(root, "workspace"); mkdirSync(runtimeRoot); mkdirSync(workspace)
  const runscPath = join(root, "fake-runsc"); const helperPath = join(root, "kodac-gvisor-proc-observe"); let sandbox: ChildProcess | undefined
  try {
    compileObserverHelper(root); compileFakeRunsc(root, runscPath, helperPath, runtimeRoot)
    const pidFile = join(runtimeRoot, "sandbox.pid"); sandbox = spawn(runscPath, ["sandbox", pidFile], { stdio: "ignore", shell: false }); await waitForFile(pidFile)
    const gateway = new ExecutionGateway(new NodeWorkspaceFileSystem(workspace), fixedPolicy("allow"), undefined, undefined, createRuntime(runscPath, helperPath, runtimeRoot, (record) => ({ ...createGvisorRuntimeLineageCommit(record), recordIdentity: "f".repeat(64) })))
    await assert.rejects(gateway.observeGvisorRuntimeInstance(fixtureRequirement()), /commit identity mismatch/)
  } finally { if (sandbox && sandbox.exitCode === null && sandbox.signalCode === null) sandbox.kill("SIGKILL"); rmSync(root, { recursive: true, force: true }) }
})
