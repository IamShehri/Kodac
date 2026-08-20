# KODAC KDO H4-R4B-B2A — POSIX ACL Mask Authorization Repair

Date: 2026-08-21
Status: **AUTHORIZATION REPAIR CANDIDATE — DOCS ONLY — NO LIVE START AUTHORITY**

## 1. Decision

This document repairs one narrow theorem in the canonical H4-R4B-B2A authorization and nothing else.

Canonical predecessor:

```text
PR #133
main=706e15b54dd6d853e2fb897f0507ada0efc15f0f
tree=1825237d24e991ae49d146659d75e7a35785a6d2
authorization_blob=418c73cdac786625dc706f32281791958223449c
```

The predecessor correctly requires a root-owned, root-client-only Docker Unix socket and protected ancestors, but its Section 6.4 additionally requires the runtime to prove that no nontrivial POSIX ACL entries exist while simultaneously forbidding every public mechanism capable of reading those ACL entries.

That textual-absence requirement is unnecessary for the actual security property and is not implementable with the authorized public Node 24 API surface.

This repair replaces **ACL textual absence** with the exact Linux POSIX ACL **effective-rights theorem** below.

All other B2A authorization clauses, path fences, zero-start requirements, ownership semantics, deadlines, state transitions, non-grants, review gates, and B2B separation remain unchanged.

---

## 2. Primary-source basis

Linux `acl(5)` defines the relevant semantics:

- `ACL_MASK` is the maximum access that can be granted by named `ACL_USER`, `ACL_GROUP_OBJ`, and named `ACL_GROUP` entries.
- When an access ACL contains `ACL_MASK`, the file's group permission bits correspond to the `ACL_MASK` permissions.
- File permission bits always match the corresponding ACL entries; modifying one updates the other.
- A named user is granted access only when both its named entry **and** `ACL_MASK` contain the requested permission.
- A matching group is granted access only when both the matching group entry and `ACL_MASK` contain the requested permission.
- `ACL_OTHER` corresponds to the file's other permission bits.

Primary references:

```text
https://man7.org/linux/man-pages/man5/acl.5.html
  CORRESPONDENCE BETWEEN ACL ENTRIES AND FILE PERMISSION BITS
  ACCESS CHECK ALGORITHM

https://man7.org/linux/man-pages/man1/getfacl.1.html
  effective rights mask description
```

This repair relies on those Linux kernel/VFS POSIX access-ACL semantics. It does **not** claim that `lstat(2)` or Node's `fs.lstat` enumerates ACL entries.

---

## 3. Corrected security property

The required property is not:

```text
NONTRIVIAL_ACL_ENTRIES_ABSENT
```

The required property is:

```text
NO_EFFECTIVE_NONOWNER_SOCKET_ACCESS
NO_EFFECTIVE_UNTRUSTED_NONOWNER_ANCESTOR_WRITE
```

B2A therefore does not need to know whether an ineffective named ACL entry exists. It must prove that Linux's effective-rights mask makes every such entry incapable of granting the protected permission.

---

## 4. Corrected Docker socket ACL theorem

The canonical positive socket posture remains exactly:

```text
SOCKET_UID=0
SOCKET_GID=0
SOCKET_MODE_BITS=0600
B2A_CLIENT_EUID=0
B2A_CLIENT_EGID=0
```

On Linux POSIX access ACLs, if a nontrivial access ACL exists, the file group permission bits correspond to `ACL_MASK`.

For mode `0600`:

```text
owner class = rw-
group class / ACL_MASK = ---
other class = ---
```

Therefore:

```text
named ACL_USER effective permissions <= ACL_MASK = ---
ACL_GROUP_OBJ effective permissions <= ACL_MASK = ---
named ACL_GROUP effective permissions <= ACL_MASK = ---
ACL_OTHER permissions = ---
```

A non-owner process without trusted host privilege therefore receives no effective discretionary socket access from a POSIX access ACL, even if named ACL entries are present textually.

The runtime MUST NOT claim that named ACL entries are absent. It proves only the relevant result: they have no effective rights capable of connecting to the socket.

---

## 5. Corrected protected-ancestor ACL theorem

Every ancestor through the socket parent remains required to be:

```text
real directory
non-symlink
uid=0
mode & 0o022 == 0
```

For an ancestor with a POSIX access ACL, its group-class permission bits correspond to `ACL_MASK`.

Because `mode & 0o022 == 0` proves:

```text
group-class write = 0
other write = 0
```

it also proves:

```text
named ACL_USER effective write <= ACL_MASK write = 0
ACL_GROUP_OBJ effective write <= ACL_MASK write = 0
named ACL_GROUP effective write <= ACL_MASK write = 0
ACL_OTHER write = 0
```

Thus the modeled untrusted non-owner principal cannot gain effective directory write authority through a POSIX access ACL merely because a named entry exists.

The authorization still requires the full ancestor device/inode/uid/gid/mode/type chain to be frozen and revalidated at the existing B2A gates.

---

## 6. Privilege boundary

The ACL/DAC theorem applies to the modeled untrusted principal:

```text
UNTRUSTED_PRINCIPAL_EUID_NE_0=YES
UNTRUSTED_PRINCIPAL_HAS_CAP_DAC_OVERRIDE=NO
UNTRUSTED_PRINCIPAL_HAS_CAP_DAC_READ_SEARCH=NO
UNTRUSTED_PRINCIPAL_HAS_EQUIVALENT_HOST_DAC_BYPASS=NO
```

Host root and processes carrying host-level DAC-bypass authority are part of the already-trusted host boundary. B2A does not claim to protect Docker from a compromised host root or an equivalently privileged host principal.

This does not widen the predecessor threat model; it makes the privilege boundary explicit.

---

## 7. Public Node 24 implementability

The corrected theorem is implementable within the already-authorized B2A path set using public Node 24 APIs:

```text
process.platform === "linux"
process.geteuid() === 0
process.getegid() === 0
fs.lstatSync(..., { bigint: true })
```

For the final socket entry the runtime proves:

```text
isSocket()=true
uid=0
gid=0
(mode & 0o777)=0o600
```

For every ancestor it proves:

```text
isDirectory()=true
uid=0
(mode & 0o022)=0
no symlink component
```

No `getfacl`, libacl binding, native helper, shell command, child process, environment assertion, caller ACL string, or serialized host-policy assertion is required or authorized.

---

## 8. Clauses superseded from PR #133

Only the following predecessor requirements are superseded.

### 8.1 Section 6.4

Supersede:

```text
NONTRIVIAL_DOCKER_SOCKET_ACCESS_ACL=FORBIDDEN
NONTRIVIAL_ANCESTOR_ACCESS_ACL_GRANTING_SOCKET_REACHABILITY=FORBIDDEN
ACL absence is a trusted host-provisioning precondition
```

with:

```text
POSIX_ACL_TEXTUAL_ABSENCE_PROOF=NOT_REQUIRED
POSIX_ACL_EFFECTIVE_RIGHTS_MASK_PROOF=REQUIRED
NO_EFFECTIVE_NONOWNER_SOCKET_ACCESS=REQUIRED
NO_EFFECTIVE_UNTRUSTED_NONOWNER_ANCESTOR_WRITE=REQUIRED
```

### 8.2 Section 21.2

Remove the requirement to reject a deployment merely because a nontrivial ACL may exist textually.

Replace it with proof that the accepted socket/ancestor mode bits imply the required effective ACL mask rights under Linux `acl(5)` semantics.

The physical negative test remains required:

```text
unauthorized non-root principal cannot connect to the accepted test socket
unauthorized non-root principal cannot replace the protected socket pathname
```

### 8.3 Section 23 future implementation merge gate

Supersede:

```text
ACL_HOST_POLICY_PRECONDITION_PROOF=PASS
```

with:

```text
LINUX_POSIX_ACL_MASK_SEMANTICS_PROOF=PASS
SOCKET_EFFECTIVE_NONOWNER_DENY_PROOF=PASS
ANCESTOR_EFFECTIVE_NONOWNER_WRITE_DENY_PROOF=PASS
```

### 8.4 Section 24 non-grants

The following remain forbidden:

```text
native ACL helper
getfacl/setfacl runtime dependency
Docker CLI fallback
shell fallback
caller-self-attested ACL safety
```

No permission to enumerate or mutate ACLs is added.

### 8.5 Section 26 acceptance criteria

Supersede the textual-ACL-absence criterion with:

```text
Linux ACL_MASK/file-mode correspondence is the authority used for effective-rights proof.
Socket uid=0 gid=0 mode=0600 implies named-user/group ACL effective rights are empty.
Ancestor mode & 0o022 == 0 implies named-user/group ACL effective write is absent.
The implementation never claims that ACL entries are textually absent.
```

---

## 9. Required implementation proofs after this repair becomes canonical

The future B2A implementation must prove all predecessor gates plus these corrected ACL-specific proofs:

```text
LINUX_ONLY_POSIX_ACL_THEOREM=PASS
ROOT_CLIENT_EUID_EGID_PROOF=PASS
SOCKET_UID_GID_MODE_0600_PROOF=PASS
SOCKET_ACL_MASK_EFFECTIVE_ZERO_PROOF=PASS
ANCESTOR_ROOT_OWNERSHIP_PROOF=PASS
ANCESTOR_GROUP_OTHER_WRITE_ZERO_PROOF=PASS
ANCESTOR_ACL_MASK_EFFECTIVE_WRITE_ZERO_PROOF=PASS
UNAUTHORIZED_NONROOT_CONNECT_NEGATIVE_PROOF=PASS
UNAUTHORIZED_NONROOT_PATH_REPLACEMENT_NEGATIVE_PROOF=PASS
NO_ACL_ENUMERATION_AUTHORITY=PASS
NO_ACL_MUTATION_AUTHORITY=PASS
NO_CALLER_ACL_ASSERTION=PASS
```

A test that merely inspects `mode=0600` and then claims **ACL entries are absent** is invalid.

A valid proof states instead that the observed mode bits are the Linux kernel-visible group-class/other effective-rights representation and derives the maximum named-ACL rights from `ACL_MASK` correspondence.

---

## 10. Non-grants

This repair does not authorize:

```text
R4B-B2A implementation in this PR
R4B-B2B
Docker start
Docker exec/restart/stop/kill/remove
workload execution
TTL ARM
termination/containment mutation
rootless Docker
0660 root:docker socket support
non-root Docker client support
ACL enumeration
ACL mutation
getfacl/setfacl
libacl/native bindings
new dependency
workflow changes
liveness/lease/heartbeat
takeover/recovery
R3G-F E4
H4 completion
H6
K3-R6+
```

---

## 11. Authorization-repair merge gates

This repair PR itself must not merge unless:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
CANONICAL_MAIN_UNMOVED_OR_EXACTLY_RECONCILED=PASS
PRIMARY_SOURCE_ACL_SEMANTICS_REVIEW=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE=PASS
```

---

## 12. Acceptance criteria

This repair may become canonical only if review accepts all of:

```text
The predecessor's ACL textual-absence requirement is not observable with the authorized Node API surface.
Linux acl(5) makes ACL_MASK the maximum rights for named users/groups and maps group mode bits to ACL_MASK when present.
Socket mode 0600 therefore proves zero effective named-user/group/other socket rights.
Ancestor group/other write bits of zero therefore prove zero effective named-user/group/other write rights.
No ACL entry enumeration or mutation is needed.
No new dependency/helper is needed.
The implementation must not claim textual ACL absence.
Host DAC-bypass principals remain inside the trusted host boundary.
All non-ACL B2A constraints from canonical PR #133 remain unchanged.
B2A remains zero-start, zero-workload, and PRESTART_READY-only.
B2B remains separately unauthorized.
```

If independent review rejects the Linux ACL-mask derivation or identifies a filesystem/privilege case that invalidates it within the accepted B2A deployment theorem, implementation remains blocked and must return to authorization again.
