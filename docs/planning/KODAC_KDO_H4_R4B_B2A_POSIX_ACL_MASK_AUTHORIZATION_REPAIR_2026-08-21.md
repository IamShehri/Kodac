# KODAC KDO H4-R4B-B2A — POSIX ACL Mask Authorization Repair

Date: 2026-08-21 (Asia/Riyadh canonical working date; GitHub PR creation occurred on 2026-08-20 UTC)
Status: **AUTHORIZATION REPAIR CANDIDATE — DOCS ONLY — NO LIVE START AUTHORITY**

## 1. Decision and normative precedence

This document repairs one narrow theorem in the canonical H4-R4B-B2A authorization and nothing else.

Canonical predecessor:

```text
PR #133
main=706e15b54dd6d853e2fb897f0507ada0efc15f0f
tree=1825237d24e991ae49d146659d75e7a35785a6d2
authorization_blob=418c73cdac786625dc706f32281791958223449c
predecessor_path=docs/planning/KODAC_KDO_H4_R4B_B2A_PRESTART_OUTPUT_OWNERSHIP_START_PREPARATION_AUTHORIZATION_2026-08-20.md
```

Normative precedence is explicit:

```text
BEFORE_THIS_REPAIR_IS_CANONICAL:
  PR_133_DOCUMENT_REMAINS_THE_ONLY_CANONICAL_B2A_AUTHORIZATION

AFTER_THIS_REPAIR_IS_CANONICAL:
  THIS_DOCUMENT_SUPERSEDES_ONLY_THE_PR_133_CLAUSES_EXPLICITLY_LISTED_IN_SECTION_9
  ALL_OTHER_PR_133_REQUIREMENTS_REMAIN_CANONICAL_AND_UNCHANGED
  IMPLEMENTERS_MUST_READ_PR_133_PLUS_THIS_REPAIR_AS_ONE_COMPOSITE_AUTHORIZATION
```

The predecessor correctly requires a root-owned, root-client-only Docker Unix socket and protected ancestors, but its Section 6.4 additionally requires the runtime to prove that no nontrivial POSIX ACL entries exist while simultaneously forbidding every public mechanism capable of reading those ACL entries.

That textual-absence requirement is unnecessary for the actual security property and is not implementable with the authorized public Node 24 API surface.

This repair replaces **ACL textual absence** with the exact Linux pathname-socket **effective-rights theorem** below.

All other B2A authorization clauses, path fences, zero-start requirements, ownership semantics, deadlines, state transitions, non-grants, review gates, and B2B separation remain unchanged.

---

## 2. Primary-source basis

### 2.1 Linux POSIX access-ACL semantics

Linux `acl(5)` defines two relevant valid access-ACL forms that B2A must distinguish rather than collapse:

1. **Minimal/no-mask access ACL**
   - contains `ACL_USER_OBJ`, `ACL_GROUP_OBJ`, and `ACL_OTHER`;
   - contains no named `ACL_USER` or named `ACL_GROUP` entries;
   - contains no `ACL_MASK`;
   - file group permission bits correspond directly to `ACL_GROUP_OBJ`.
2. **Extended/masked access ACL**
   - may contain named `ACL_USER` and/or named `ACL_GROUP` entries;
   - contains `ACL_MASK`;
   - `ACL_MASK` is the maximum access that can be granted by named `ACL_USER`, `ACL_GROUP_OBJ`, and named `ACL_GROUP` entries;
   - file group permission bits correspond to `ACL_MASK`.

In both forms, file owner bits correspond to `ACL_USER_OBJ` and file other bits correspond to `ACL_OTHER`. File permission bits and the corresponding ACL entries are kept consistent by the Linux POSIX ACL model.

Named-user and named-group effective permissions therefore use the mask branch only when `ACL_MASK` exists. B2A MUST NOT claim that `ACL_MASK` exists for a minimal access ACL.

Primary references:

```text
https://man7.org/linux/man-pages/man5/acl.5.html
  VALID ACLs
  CORRESPONDENCE BETWEEN ACL ENTRIES AND FILE PERMISSION BITS
  ACCESS CHECK ALGORITHM

https://man7.org/linux/man-pages/man1/getfacl.1.html
  effective rights mask description

https://man7.org/linux/man-pages/man1/setfacl.1.html
  explicit mask entry and --no-mask fixture semantics
```

### 2.2 Linux pathname Unix-socket permission semantics

Linux `unix(7)` defines the load-bearing pathname-socket permission behavior:

- pathname sockets honor filesystem permissions;
- creating a pathname socket requires write and search permission on the containing directory;
- on Linux, connecting to a pathname `SOCK_STREAM` socket requires write permission on the socket object;
- abstract Unix sockets do not use pathname permission semantics and remain forbidden by B2A.

Linux `connect(2)` independently states that pathname `AF_UNIX` connect can fail with `EACCES` when write permission is denied on the socket file or search permission is denied on a directory in the path prefix.

Linux `rename(2)` and `unlink(2)` state that pathname replacement/removal requires write permission on the relevant containing directory, together with path-search requirements and any additional sticky-bit restrictions.

Primary references:

```text
https://man7.org/linux/man-pages/man7/unix.7.html
  Pathname socket ownership and permissions

https://man7.org/linux/man-pages/man2/connect.2.html
  AF_UNIX pathname EACCES rules

https://man7.org/linux/man-pages/man2/rename.2.html
  directory write/search permission requirements

https://man7.org/linux/man-pages/man2/unlink.2.html
  directory write/search permission requirements
```

### 2.3 Linux filesystem credentials and privilege bypass

Linux `path_resolution(7)` states that pathname permission checks use filesystem credentials (`fsuid`/`fsgid`) and that superuser/capability authority can bypass ordinary permission checks.

B2A therefore makes two precise claims:

1. the **negative-principal theorem** applies only to untrusted principals without host DAC/ownership/path-mutation privilege; and
2. `process.geteuid() === 0` / `process.getegid() === 0` are trusted composition constraints for the B2A process, not a false claim that Node exposes or proves current `fsuid`/`fsgid`.

The actual Docker pathname-socket connection remains subject to Linux VFS permission enforcement. If the trusted process's filesystem credentials or host state do not permit the connection, the connection fails and B2A fails closed; no fallback or permission mutation is authorized.

Primary references:

```text
https://man7.org/linux/man-pages/man7/path_resolution.7.html
  filesystem UID/GID permission checks
  permission-check bypass by superuser/capabilities

https://man7.org/linux/man-pages/man7/capabilities.7.html
  CAP_DAC_OVERRIDE
  CAP_DAC_READ_SEARCH
  CAP_CHOWN
  CAP_FOWNER
```

### 2.4 Linux user-namespace and host-ID mapping semantics

Linux `user_namespaces(7)` establishes that UID/GID and capabilities are namespace-relative: an ordinary unprivileged host user can appear as UID 0 with a full capability set inside a child user namespace while remaining unprivileged outside it.

The same source exposes `/proc/<pid>/uid_map` and `/proc/<pid>/gid_map` as the namespace ID mappings and documents the initial user namespace's dummy full identity mapping as:

```text
0 0 4294967295
```

A non-initial namespace can map parent UID 0 only under privileged parent-side mapping rules. Under B2A's existing trusted-host-root boundary, a child namespace created by such trusted host privilege is not an untrusted rootless bypass. Ordinary rootless/user-namespace execution cannot satisfy the required full host identity mapping.

Primary references:

```text
https://man7.org/linux/man-pages/man7/user_namespaces.7.html
  namespace-relative UID/GID and capabilities
  /proc/pid/uid_map and gid_map
  initial user namespace full identity mapping
  privileged rules for mappings that include parent UID 0

https://man7.org/linux/man-pages/man5/proc_pid_uid_map.5.html
  proc uid_map/gid_map interface
```

This repair relies on Linux kernel/VFS pathname and POSIX access-ACL semantics. It does **not** claim that `lstat(2)` or Node's `fs.lstat` enumerates ACL entries.

---

## 3. Corrected security property

The required property is not:

```text
NONTRIVIAL_ACL_ENTRIES_ABSENT
```

The required property is:

```text
HOST_ID_MAPPING_EQUIVALENT_TO_INITIAL_NAMESPACE=YES
NO_EFFECTIVE_NONOWNER_SOCKET_WRITE
NO_EFFECTIVE_UNTRUSTED_NONOWNER_ANCESTOR_WRITE
LINUX_PATHNAME_SOCKET_DAC_ENFORCED
UNTRUSTED_PRINCIPAL_OWNERSHIP_ACL_MUTATION_AUTHORITY=0
POSIX_ACL_MASK_PRESENT_AND_ABSENT_CASES_COVERED=YES
```

B2A therefore does not need to know whether an ineffective named ACL entry exists. For an extended ACL, it derives named-user/group effective rights through `ACL_MASK`. For a minimal ACL without `ACL_MASK`, it derives group-class rights directly from `ACL_GROUP_OBJ` and relies on the POSIX validity rule that named `ACL_USER`/`ACL_GROUP` entries are absent. It must also prove that the running process is not ordinary rootless namespace-relative UID 0 and that the modeled untrusted principal cannot mutate ownership/mode/ACL state to escape the theorem.

---

## 4. Corrected Docker socket ACL + connect theorem

The canonical positive socket posture remains exactly:

```text
SOCKET_UID=0
SOCKET_GID=0
SOCKET_MODE_BITS=0600
B2A_CLIENT_EUID=0
B2A_CLIENT_EGID=0
HOST_UID_MAP=FULL_IDENTITY
HOST_GID_MAP=FULL_IDENTITY
ABSTRACT_SOCKET=NO
```

For mode `0600`, owner-class write exists and both group-class and other-class permissions are empty. The POSIX ACL proof then has two valid branches.

### 4.1 Extended ACL with `ACL_MASK`

When an extended access ACL exists:

```text
owner class / ACL_USER_OBJ = rw-
group class / ACL_MASK = ---
other class / ACL_OTHER = ---
```

Therefore:

```text
named ACL_USER effective permissions <= ACL_MASK = ---
ACL_GROUP_OBJ effective permissions <= ACL_MASK = ---
named ACL_GROUP effective permissions <= ACL_MASK = ---
ACL_OTHER permissions = ---
SOCKET_EFFECTIVE_NONOWNER_WRITE=0
```

### 4.2 Minimal ACL without `ACL_MASK`

When the valid access ACL has no `ACL_MASK`:

```text
named ACL_USER entries = ABSENT
named ACL_GROUP entries = ABSENT
owner class / ACL_USER_OBJ = rw-
group class / ACL_GROUP_OBJ = ---
other class / ACL_OTHER = ---
SOCKET_EFFECTIVE_NONOWNER_WRITE=0
```

No mask-based statement is made in this branch.

### 4.3 Connection consequence

Linux pathname `SOCK_STREAM` connect requires write permission on the socket object. Therefore, for the modeled ordinary unprivileged non-owner principal under either valid POSIX ACL branch:

```text
SOCKET_EFFECTIVE_NONOWNER_WRITE=0
=> UNTRUSTED_NONROOT_STREAM_CONNECT=DENIED_BY_LINUX_PATHNAME_SOCKET_DAC
```

This is a Linux-specific theorem; it is not generalized to operating systems that ignore Unix-socket inode permissions or to non-POSIX access-ACL authorization models.

A non-owner process without trusted host privilege therefore receives no effective discretionary socket-connect authority from either valid POSIX ACL form accepted by this theorem.

The runtime MUST NOT claim that named ACL entries are absent in the extended/masked branch. It also MUST NOT invent an `ACL_MASK` in the minimal/no-mask branch. The runtime derives only the effective-rights consequence represented by the kernel-visible mode class under the accepted Linux POSIX ACL model.

A successful positive-path attach still requires the actual trusted B2A process to complete the pathname socket connection through Linux VFS. If that connection is denied for any reason, B2A fails closed and grants no readiness.

---

## 5. Corrected protected-ancestor ACL + pathname-mutation theorem

Every ancestor through the socket parent remains required to be:

```text
real directory
non-symlink
uid=0
mode & 0o022 == 0
```

Because `mode & 0o022 == 0` proves:

```text
group-class write = 0
other write = 0
```

the POSIX ACL proof again has two branches.

### 5.1 Extended ACL with `ACL_MASK`

When the ancestor has an extended access ACL:

```text
named ACL_USER effective write <= ACL_MASK write = 0
ACL_GROUP_OBJ effective write <= ACL_MASK write = 0
named ACL_GROUP effective write <= ACL_MASK write = 0
ACL_OTHER write = 0
ANCESTOR_EFFECTIVE_NONOWNER_WRITE=0
```

### 5.2 Minimal ACL without `ACL_MASK`

When the ancestor has a valid minimal access ACL with no mask:

```text
named ACL_USER entries = ABSENT
named ACL_GROUP entries = ABSENT
ACL_GROUP_OBJ write = group-class write = 0
ACL_OTHER write = 0
ANCESTOR_EFFECTIVE_NONOWNER_WRITE=0
```

No mask-based statement is made in this branch.

### 5.3 Pathname-mutation consequence

Linux pathname socket creation requires directory write+search permission; rename and unlink likewise require write on the relevant containing directory in addition to path-search and other restrictions.

Therefore lack of effective non-owner directory write is sufficient to deny the modeled non-owner the mutation authority needed to create, unlink, or rename a replacement entry in the protected socket namespace:

```text
ANCESTOR_EFFECTIVE_NONOWNER_WRITE=0
=> UNTRUSTED_NONROOT_CREATE_REPLACE_UNLINK_AUTHORITY=0
```

The theorem does not claim that directory search permission is absent. Search permission alone does not supply the missing directory write authority required for these namespace mutations.

The authorization still requires the full ancestor device/inode/uid/gid/mode/type chain to be frozen and revalidated at the existing B2A gates.

---

## 6. Privilege, ownership-mutation, and filesystem boundary

The ACL/DAC theorem applies to the modeled untrusted principal only when every following statement holds:

```text
UNTRUSTED_PRINCIPAL_FSUID_NE_0=YES
UNTRUSTED_PRINCIPAL_HAS_CAP_DAC_OVERRIDE=NO
UNTRUSTED_PRINCIPAL_HAS_CAP_DAC_READ_SEARCH=NO
UNTRUSTED_PRINCIPAL_HAS_CAP_CHOWN=NO
UNTRUSTED_PRINCIPAL_HAS_CAP_FOWNER=NO
UNTRUSTED_PRINCIPAL_HAS_EQUIVALENT_HOST_DAC_BYPASS=NO
UNTRUSTED_PRINCIPAL_CAN_CHANGE_PROTECTED_UID_GID=NO
UNTRUSTED_PRINCIPAL_CAN_CHANGE_PROTECTED_MODE=NO
UNTRUSTED_PRINCIPAL_CAN_CHANGE_PROTECTED_ACCESS_ACL=NO
```

`CAP_CHOWN` is explicitly excluded because it permits arbitrary UID/GID changes. `CAP_FOWNER` is explicitly excluded because it bypasses ownership checks for mode/ACL-affecting operations and sticky-directory restrictions.

Host root and processes carrying host-level DAC/ownership/path-mutation authority are part of the already-trusted host boundary. B2A does not claim to protect Docker from a compromised host root or an equivalently privileged host principal.

The accepted filesystem theorem is specifically Linux pathname-socket + Linux VFS POSIX access-ACL semantics. Unsupported or richer non-POSIX ACL authorization models are outside B2A v1. The existing implementation stop rule remains normative: if the later B2A implementation cannot bind the accepted filesystem/mount model with public Node 24 APIs and the authorized path set, it must stop and return to authorization rather than assume the model.

---

## 7. Host-ID mapping gate — rejecting rootless namespace-relative UID 0

B2A MUST NOT treat `geteuid() === 0`, `getegid() === 0`, or `lstat().uid === 0` alone as proof of host-root identity.

Before any B2A preparation transaction, the trusted runtime must read the fixed kernel interfaces:

```text
/proc/self/uid_map
/proc/self/gid_map
```

using public Node `fs.readFileSync` with no caller-provided path.

Normalize ASCII whitespace only and parse mapping triplets as unsigned decimal integers. Each file must contain **exactly one** mapping triplet and it must be exactly:

```text
inside_start=0
outside_start=0
length=4294967295
```

Therefore:

```text
UID_MAP_CANONICAL=0:0:4294967295
GID_MAP_CANONICAL=0:0:4294967295
HOST_ID_MAPPING_EQUIVALENT_TO_INITIAL_NAMESPACE=YES
```

Any of the following is fail-closed rejection before preparation/claim/attach:

```text
/proc unavailable or unreadable
empty map
multiple mapping extents
partial range
non-zero outside_start
non-zero inside_start
range length other than 4294967295
malformed/non-decimal/negative/overflow value
mapping read changes between required revalidation points
```

The runtime does not claim that these text files reveal a namespace inode identity. They establish the accepted **equivalent host-ID-mapping invariant**. A non-initial namespace created with privilege sufficient to install the same full identity map is attributable to the already-trusted host-privilege boundary; ordinary rootless execution cannot forge this invariant.

The map values must be frozen with the other host trust facts and re-read at the existing B2A namespace/trust revalidation gates before positive `PRESTART_READY`.

---

## 8. Public Node 24 implementability

The corrected theorem remains implementable within the already-authorized B2A path set using public Node 24 APIs:

```text
process.platform === "linux"
process.geteuid() === 0
process.getegid() === 0
fs.readFileSync("/proc/self/uid_map", "utf8")
fs.readFileSync("/proc/self/gid_map", "utf8")
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

`geteuid/getegid` are composition constraints, not an invented Node `fsuid/fsgid` attestation. The host-ID maps close ordinary rootless namespace-relative UID/GID ambiguity; the live socket operation remains subject to the kernel's actual credential and pathname checks.

No runtime `getfacl`, `setfacl`, libacl binding, native helper, shell command, child process, environment assertion, caller ACL string, serialized host-policy assertion, permission mutation, or retry-with-broader-authority path is required or authorized.

---

## 9. Clauses superseded from PR #133

Only the following clauses in the exact predecessor document are superseded **after this repair itself becomes canonical**:

```text
docs/planning/KODAC_KDO_H4_R4B_B2A_PRESTART_OUTPUT_OWNERSHIP_START_PREPARATION_AUTHORIZATION_2026-08-20.md
```

### 9.1 Predecessor Section 6.4

Supersede:

```text
NONTRIVIAL_DOCKER_SOCKET_ACCESS_ACL=FORBIDDEN
NONTRIVIAL_ANCESTOR_ACCESS_ACL_GRANTING_SOCKET_REACHABILITY=FORBIDDEN
ACL absence is a trusted host-provisioning precondition
```

with:

```text
POSIX_ACL_TEXTUAL_ABSENCE_PROOF=NOT_REQUIRED
POSIX_ACL_EFFECTIVE_RIGHTS_PROOF=REQUIRED
POSIX_ACL_MASK_PRESENT_AND_ABSENT_CASES_PROOF=REQUIRED
NO_EFFECTIVE_NONOWNER_SOCKET_WRITE=REQUIRED
NO_EFFECTIVE_UNTRUSTED_NONOWNER_ANCESTOR_WRITE=REQUIRED
LINUX_PATHNAME_SOCKET_WRITE_PERMISSION_THEOREM=REQUIRED
HOST_ID_MAPPING_EQUIVALENT_TO_INITIAL_NAMESPACE=REQUIRED
CAP_CHOWN_UNTRUSTED_PRINCIPAL=FORBIDDEN
CAP_FOWNER_UNTRUSTED_PRINCIPAL=FORBIDDEN
```

### 9.2 Predecessor Section 21.2

Remove the requirement to reject a deployment merely because a nontrivial ACL may exist textually.

Replace it with proof that the accepted socket/ancestor mode bits imply the required effective rights under both valid Linux POSIX access-ACL forms: masked extended ACLs and minimal no-mask ACLs. The connection proof additionally requires that Linux pathname `SOCK_STREAM` connect requires effective socket write permission.

The physical negative proofs remain required and are strengthened by Section 10 below.

### 9.3 Predecessor Section 23 future implementation merge gate

Supersede:

```text
ACL_HOST_POLICY_PRECONDITION_PROOF=PASS
```

with:

```text
HOST_ID_MAPPING_GATE_PROOF=PASS
LINUX_POSIX_ACL_MASK_SEMANTICS_PROOF=PASS
POSIX_ACL_MASK_PRESENT_AND_ABSENT_CASES_PROOF=PASS
LINUX_PATHNAME_SOCKET_WRITE_PERMISSION_PROOF=PASS
PATH_PREFIX_PERMISSION_ENFORCEMENT_PROOF=PASS
SOCKET_EFFECTIVE_NONOWNER_WRITE_DENY_PROOF=PASS
ANCESTOR_EFFECTIVE_NONOWNER_WRITE_DENY_PROOF=PASS
EXTENDED_ACL_PHYSICAL_NEGATIVE_PROOF=PASS
MINIMAL_ACL_NO_MASK_BASELINE_PROOF=PASS
OWNERSHIP_ACL_MUTATION_NEGATIVE_PROOF=PASS
```

### 9.4 Predecessor Section 24 non-grants

The following remain forbidden in product/runtime code:

```text
native ACL helper
runtime getfacl/setfacl
Docker CLI fallback
shell fallback
caller-self-attested ACL safety
permission mutation or chmod/chown repair
caller-provided /proc path
caller-provided uid_map/gid_map assertion
```

No production permission to enumerate or mutate ACLs is added.

### 9.5 Predecessor Section 26 acceptance criteria

Supersede the textual-ACL-absence criterion with:

```text
For an extended POSIX access ACL, group mode bits correspond to ACL_MASK and named-user/group effective rights are capped by that mask.
For a minimal POSIX access ACL without ACL_MASK, named ACL_USER/ACL_GROUP entries are absent and group mode bits correspond directly to ACL_GROUP_OBJ.
Linux pathname SOCK_STREAM connect requires effective write permission on the socket object.
Socket uid=0 gid=0 mode=0600 implies zero non-owner socket write in both valid POSIX ACL branches.
Ancestor mode & 0o022 == 0 implies zero non-owner directory write in both valid POSIX ACL branches.
Lack of containing-directory write denies the namespace mutation needed for replacement/unlink/create by the modeled unprivileged non-owner.
Full host identity uid_map/gid_map is required before B2A preparation.
CAP_CHOWN and CAP_FOWNER are excluded from the untrusted-principal theorem.
The implementation never claims that ACL entries are textually absent and never invents an ACL_MASK for the minimal branch.
```

No other predecessor clause is superseded.

---

## 10. Required extended-ACL, minimal-ACL, and rootless negative fixtures

The two ACL fixtures below are **causal DAC proofs**, not merely failure observations. Each fixture must use one stable untrusted actor identity for its positive controls and denial checks. Trusted setup authority may create fixture objects and ACLs, but it may not perform the actor's control or denial operation on the actor's behalf.

Immediately before the permission-behavior sequence, the test harness must bind the negative actor's filesystem credential, group-class identity, and capability preconditions. The harness may read the fixed kernel status interface for that actor solely as test evidence:

```text
/proc/<negative-actor-pid>/status
```

The `Uid:` row's filesystem-UID field must be nonzero for the same actor PID that performs every control and denial operation. The test harness must retain that exact numeric value as `negative_actor_fsuid`. The actor's effective and supplementary group IDs must likewise be captured from kernel-visible process identity evidence for group-class fixture binding.

The actor must additionally satisfy:

```text
negative_actor_fsuid > 0
UNTRUSTED_PRINCIPAL_FSUID_NE_0=YES
CAP_DAC_OVERRIDE=NO
CAP_DAC_READ_SEARCH=NO
CAP_CHOWN=NO
CAP_FOWNER=NO
SAME_ACTOR_FOR_CONTROL_AND_DENIAL=YES
```

This `/proc/<negative-actor-pid>/status` read and group-membership observation are test-harness evidence only. They add no product/runtime filesystem-credential or process-identity inspection authority.

### 10.1 Extended-ACL physical fixture

The future B2A implementation proof MUST include a Linux physical fixture containing real named POSIX access-ACL entries whose qualifier is exactly the same negative actor's filesystem UID and whose requested rights exceed their effective rights because of `ACL_MASK`.

A **test-harness-only** use of the host `setfacl` utility is authorized solely to construct temporary proof fixtures. This is not runtime authority and is not a package dependency.

Exact authority boundary:

```text
TEST_FIXTURE_SETUP_SETFACL=AUTHORIZED
TEST_FIXTURE_SCOPE=TEMPORARY_NON_PRODUCT_PATHS_ONLY
TEST_FIXTURE_DOCKER_SOCKET_PATH=FORBIDDEN
PRODUCTION_SETFACL_CALLS=0
PRODUCTION_GETFACL_CALLS=0
PRODUCT_CHILD_PROCESS_ACL_HELPER=NO
PACKAGE_DEPENDENCY_CHANGE=NO
WORKFLOW_DEPENDENCY_INSTALLATION=NOT_AUTHORIZED_BY_THIS_REPAIR
```

If the proof host does not provide a trustworthy POSIX ACL fixture capability, the physical proof cannot claim PASS and the implementation merge remains blocked. The product runtime must never compensate by adding ACL enumeration or mutation authority.

Before the denial case, the **same negative actor** must pass a positive socket control on a separate temporary pathname socket in the same trusted fixture prefix:

```text
CONTROL_SOCKET_IS_LISTENING=YES
CONTROL_PATH_SEARCH_PERMISSION=ALLOWED
CONTROL_SOCKET_EFFECTIVE_ACTOR_WRITE=ALLOWED
SAME_ACTOR_STREAM_CONNECT_CONTROL=SUCCESS
```

The denial socket must then establish all of the following before the connect attempt:

```text
DENIAL_SOCKET_IS_LISTENING=YES
DENIAL_PATH_SEARCH_PERMISSION=ALLOWED
DENIAL_SOCKET_IDENTITY_FROZEN=YES
ACL_USER:<negative_actor_fsuid>=rw-
ACL_USER_QUALIFIER_EQUALS_NEGATIVE_ACTOR_FSUID=YES
ACL_MASK=---
SOCKET_EFFECTIVE_UNTRUSTED_WRITE=---
UNTRUSTED_PRINCIPAL_FSUID_NE_0=YES
```

The same actor must receive the operation-specific Linux pathname-socket permission result:

```text
SAME_ACTOR_STREAM_CONNECT_DENIAL=EACCES
DENIAL_SOCKET_IDENTITY_UNCHANGED=YES
```

A refused connection, missing listener, missing path-search permission, nonexistent socket, different actor, mismatched ACL_USER qualifier, or any error other than the expected permission denial cannot satisfy this proof.

The protected-directory portion must likewise include a same-actor positive control in a separate temporary control directory before the denial operations:

```text
CONTROL_DIRECTORY_SEARCH=ALLOWED
CONTROL_DIRECTORY_WRITE=ALLOWED
CONTROL_DIRECTORY_S_ISVTX=0
SAME_ACTOR_CREATE_CONTROL=SUCCESS
SAME_ACTOR_UNLINK_CONTROL=SUCCESS
SAME_ACTOR_RENAME_CONTROL=SUCCESS
```

The denial directory must bind the named ACL entry to the same negative actor filesystem UID and must prove that sticky-bit behavior cannot cause the denial:

```text
ACL_USER:<negative_actor_fsuid>=rwx
ACL_USER_QUALIFIER_EQUALS_NEGATIVE_ACTOR_FSUID=YES
ACL_MASK=r-x
DIRECTORY_EFFECTIVE_UNTRUSTED_WRITE=0
DIRECTORY_EFFECTIVE_UNTRUSTED_SEARCH=1
DENIAL_DIRECTORY_PATH_SEARCH=ALLOWED
DENIAL_DIRECTORY_S_ISVTX=0
```

Before each denial attempt the target state must be exact:

```text
CREATE_DENIAL_TARGET=ABSENT
UNLINK_DENIAL_TARGET=EXISTS_AND_IDENTITY_FROZEN
RENAME_SOURCE=EXISTS_ACTOR_REACHABLE_AND_IDENTITY_FROZEN
RENAME_DENIAL_TARGET=EXISTS_AND_IDENTITY_FROZEN
```

The same actor must then prove:

```text
CREATE_REPLACEMENT_DENIAL=EACCES
CREATE_DENIAL_TARGET_REMAINS_ABSENT=YES
UNLINK_PROTECTED_DENIAL=EACCES
UNLINK_DENIAL_TARGET_IDENTITY_UNCHANGED=YES
RENAME_OVER_PROTECTED_DENIAL=EACCES
RENAME_DENIAL_TARGET_IDENTITY_UNCHANGED=YES
RENAME_SOURCE_IDENTITY_UNCHANGED=YES
```

Any setup failure, target absence where existence is required, source absence, path-search failure, sticky-bit presence, actor-to-ACL qualifier mismatch, cross-actor substitution, or non-permission failure makes the causal DAC proof invalid.

The fixture must also prove the same untrusted actor cannot change the root-owned fixture's UID/GID, mode, or access ACL. Test setup may use trusted fixture-owner/root authority; the negative actor itself remains bound by the common `fsuid` and no-capability preconditions above.

### 10.2 Minimal/no-mask baseline fixture

The proof matrix must separately cover the valid minimal POSIX access-ACL branch without `ACL_MASK`.

A temporary test fixture may use trusted fixture setup to remove extended entries and establish a known minimal ACL. Because this branch claims to exercise `ACL_GROUP_OBJ`, the denial fixture's owning group must be a group that the same negative actor actually belongs to; otherwise the actor would fall through to `ACL_OTHER` and would not prove the intended group-object theorem.

The proof must establish:

```text
ACL_MASK=ABSENT
NAMED_ACL_USER_ENTRIES=ABSENT
NAMED_ACL_GROUP_ENTRIES=ABSENT
MINIMAL_FIXTURE_GID=<captured actor effective-or-supplementary gid>
NEGATIVE_ACTOR_GROUP_MEMBERSHIP_INCLUDES_MINIMAL_FIXTURE_GID=YES
SOCKET_DENIAL_GID=MINIMAL_FIXTURE_GID
SOCKET_GROUP_CLASS=ACL_GROUP_OBJ=---
ANCESTOR_DENIAL_GID=MINIMAL_FIXTURE_GID
ANCESTOR_GROUP_CLASS_WRITE=ACL_GROUP_OBJ_WRITE=0
UNTRUSTED_PRINCIPAL_FSUID_NE_0=YES
```

A nonmember actor may be used only in a separate explicitly labeled `ACL_OTHER` test; it cannot satisfy the `ACL_GROUP_OBJ` proof required here.

The **same negative actor** used for the minimal fixture's denial checks must first pass positive controls on separate temporary control objects:

```text
MINIMAL_CONTROL_SOCKET_IS_LISTENING=YES
MINIMAL_CONTROL_PATH_SEARCH_PERMISSION=ALLOWED
MINIMAL_CONTROL_SOCKET_ACTOR_WRITE=ALLOWED
SAME_ACTOR_MINIMAL_STREAM_CONNECT_CONTROL=SUCCESS
MINIMAL_CONTROL_DIRECTORY_SEARCH=ALLOWED
MINIMAL_CONTROL_DIRECTORY_WRITE=ALLOWED
MINIMAL_CONTROL_DIRECTORY_S_ISVTX=0
SAME_ACTOR_MINIMAL_CREATE_CONTROL=SUCCESS
SAME_ACTOR_MINIMAL_UNLINK_CONTROL=SUCCESS
SAME_ACTOR_MINIMAL_RENAME_CONTROL=SUCCESS
```

The minimal/no-mask denial socket must then prove before connection:

```text
MINIMAL_DENIAL_SOCKET_IS_LISTENING=YES
MINIMAL_DENIAL_PATH_SEARCH_PERMISSION=ALLOWED
MINIMAL_DENIAL_SOCKET_IDENTITY_FROZEN=YES
ACL_MASK=ABSENT
NAMED_ACL_USER_ENTRIES=ABSENT
NAMED_ACL_GROUP_ENTRIES=ABSENT
MINIMAL_DENIAL_SOCKET_GID=MINIMAL_FIXTURE_GID
NEGATIVE_ACTOR_GROUP_MEMBERSHIP_INCLUDES_MINIMAL_FIXTURE_GID=YES
SOCKET_GROUP_CLASS=ACL_GROUP_OBJ=---
```

The same actor must receive:

```text
SAME_ACTOR_MINIMAL_STREAM_CONNECT_DENIAL=EACCES
MINIMAL_DENIAL_SOCKET_IDENTITY_UNCHANGED=YES
```

For protected-path mutation, the denial directory must preserve search while withholding write, must bind the owning group to the actor's captured group class, must exclude sticky-bit behavior, and must establish exact target state before each operation:

```text
MINIMAL_DENIAL_DIRECTORY_GID=MINIMAL_FIXTURE_GID
NEGATIVE_ACTOR_GROUP_MEMBERSHIP_INCLUDES_MINIMAL_FIXTURE_GID=YES
MINIMAL_DENIAL_DIRECTORY_SEARCH=ALLOWED
MINIMAL_DENIAL_DIRECTORY_WRITE=DENIED
MINIMAL_DENIAL_DIRECTORY_S_ISVTX=0
MINIMAL_CREATE_DENIAL_TARGET=ABSENT
MINIMAL_UNLINK_DENIAL_TARGET=EXISTS_AND_IDENTITY_FROZEN
MINIMAL_RENAME_SOURCE=EXISTS_ACTOR_REACHABLE_AND_IDENTITY_FROZEN
MINIMAL_RENAME_DENIAL_TARGET=EXISTS_AND_IDENTITY_FROZEN
```

The same actor must then receive operation-specific permission denial with causal state preservation:

```text
MINIMAL_CREATE_REPLACEMENT_DENIAL=EACCES
MINIMAL_CREATE_DENIAL_TARGET_REMAINS_ABSENT=YES
MINIMAL_UNLINK_PROTECTED_DENIAL=EACCES
MINIMAL_UNLINK_DENIAL_TARGET_IDENTITY_UNCHANGED=YES
MINIMAL_RENAME_OVER_PROTECTED_DENIAL=EACCES
MINIMAL_RENAME_DENIAL_TARGET_IDENTITY_UNCHANGED=YES
MINIMAL_RENAME_SOURCE_IDENTITY_UNCHANGED=YES
```

A different actor, actor outside the owning-group class, missing listener, failed path search, sticky-bit presence, missing required target/source, or any non-permission failure invalidates the minimal `ACL_GROUP_OBJ` proof. This fixture is a test theorem only; product runtime still does not enumerate ACL entries.

### 10.3 Rootless/user-namespace negative fixture

The implementation test matrix must include deterministic rejection fixtures for `/proc/self/uid_map` and `/proc/self/gid_map` values representing ordinary rootless/user-namespace mappings, including at minimum:

```text
0 1000 1
0 100000 65536
multiple extents
partial identity range
```

Each case must prove:

```text
HOST_ID_MAPPING_GATE=REJECT
PREPARATION_COMMIT=0
OWNER_CLAIM=0
ATTACH_CALLS=0
READER_COUNT=0
PRESTART_READY_COUNT=0
START_CALLS=0
```

The production reader uses only fixed `/proc/self/{uid_map,gid_map}` paths. Test injection of map text may exist only behind a module-internal test seam and may not be exported from the package root or accepted from product callers.

A physical rootless/user-namespace run is additionally required where the proof host permits safe user-namespace creation. If host policy disallows such namespace creation, deterministic mapping fixtures remain required and the physical case must be reported as unavailable rather than fabricated as PASS.

---

## 11. Required implementation proofs after this repair becomes canonical

The future B2A implementation must prove all predecessor gates plus these corrected ACL/pathname/host-boundary proofs:

```text
LINUX_ONLY_PATHNAME_SOCKET_THEOREM=PASS
HOST_ID_MAPPING_GATE_PROOF=PASS
ROOTLESS_MAPPING_NEGATIVE_PROOF=PASS
ROOT_CLIENT_EUID_EGID_COMPOSITION_PROOF=PASS
POSIX_ACL_MASK_PRESENT_AND_ABSENT_CASES_PROOF=PASS
SOCKET_UID_GID_MODE_0600_PROOF=PASS
SOCKET_ACL_MASK_EFFECTIVE_WRITE_ZERO_PROOF=PASS
SOCKET_MINIMAL_ACL_GROUP_OBJ_WRITE_ZERO_PROOF=PASS
LINUX_STREAM_CONNECT_REQUIRES_SOCKET_WRITE_PROOF=PASS
ANCESTOR_ROOT_OWNERSHIP_PROOF=PASS
ANCESTOR_GROUP_OTHER_WRITE_ZERO_PROOF=PASS
ANCESTOR_ACL_MASK_EFFECTIVE_WRITE_ZERO_PROOF=PASS
ANCESTOR_MINIMAL_ACL_GROUP_OBJ_WRITE_ZERO_PROOF=PASS
PATH_MUTATION_REQUIRES_DIRECTORY_WRITE_PROOF=PASS
CAP_CHOWN_UNTRUSTED_PRINCIPAL_EXCLUDED=PASS
CAP_FOWNER_UNTRUSTED_PRINCIPAL_EXCLUDED=PASS
NEGATIVE_ACTOR_FSUID_NONZERO_PROOF=PASS
EXTENDED_ACL_ACTOR_QUALIFIER_BINDING_PROOF=PASS
MINIMAL_ACL_GROUP_CLASS_BINDING_PROOF=PASS
DENIAL_DIRECTORY_STICKY_BIT_ZERO_PROOF=PASS
SAME_ACTOR_POSITIVE_CONTROL_PROOF=PASS
EXTENDED_ACL_SOCKET_CONNECT_NEGATIVE_PROOF=PASS
EXTENDED_ACL_PATH_MUTATION_NEGATIVE_PROOF=PASS
MINIMAL_ACL_SOCKET_CONNECT_NEGATIVE_PROOF=PASS
MINIMAL_ACL_PATH_MUTATION_NEGATIVE_PROOF=PASS
OPERATION_SPECIFIC_EACCES_PROOF=PASS
PATHNAME_IDENTITY_PRESERVATION_PROOF=PASS
OWNERSHIP_MODE_ACL_MUTATION_NEGATIVE_PROOF=PASS
NO_ACL_ENUMERATION_AUTHORITY=PASS
NO_ACL_MUTATION_AUTHORITY=PASS
NO_PERMISSION_REPAIR_AUTHORITY=PASS
NO_CALLER_ACL_ASSERTION=PASS
NO_CALLER_HOST_ID_MAP_ASSERTION=PASS
```

A test that merely inspects `mode=0600` and then claims **ACL entries are absent** is invalid.

A valid proof distinguishes both POSIX ACL branches. For an extended ACL it derives the maximum named rights through `ACL_MASK`, binds the named `ACL_USER` qualifier to the same negative actor filesystem UID, and demonstrates denial with a real extended-ACL fixture. For a minimal/no-mask ACL it derives group rights directly from `ACL_GROUP_OBJ`, requires named user/group entries to be absent by the valid-minimal-ACL contract, binds the denial fixture owning group to a group the same actor belongs to, and demonstrates the same denial in a separate baseline fixture.

Both physical ACL fixtures must be causal: the same actor must pass control operations when the relevant permission is intentionally granted, then receive operation-specific `EACCES` when write is removed while listener/path-search/target-state prerequisites remain valid. The harness must bind that actor's filesystem UID as nonzero immediately before the permission sequence, exclude sticky-bit denials, bind the actor to the ACL class claimed by each fixture, and preserve the protected pathname identities after every denied mutation.

The product implementation must not attempt to inspect or modify another process's filesystem credentials. If the trusted B2A process cannot actually connect under the kernel's current credential state, readiness fails closed.

---

## 12. Non-grants

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
abstract Unix socket
0660 root:docker socket support
non-root Docker client support
runtime ACL enumeration
runtime ACL mutation
runtime inspection of another process's fsuid/fsgid
permission repair
chmod/chown repair
runtime getfacl/setfacl
libacl/native bindings
new package dependency
workflow changes
liveness/lease/heartbeat
takeover/recovery
R3G-F E4
H4 completion
H6
K3-R6+
```

The sole additional proof-harness grants are the bounded temporary-fixture `setfacl` authority and negative-actor kernel-visible identity evidence reads in Section 10. They create no product/runtime capability.

---

## 13. Authorization-repair merge gates

This repair PR itself must not merge unless:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
CANONICAL_MAIN_UNMOVED_OR_EXACTLY_RECONCILED=PASS
PRIMARY_SOURCE_ACL_SEMANTICS_REVIEW=PASS
PRIMARY_SOURCE_UNIX_PATHNAME_PERMISSION_REVIEW=PASS
PRIMARY_SOURCE_USER_NAMESPACE_REVIEW=PASS
CAPABILITY_BOUNDARY_REVIEW=PASS
POSIX_ACL_MASK_PRESENT_AND_ABSENT_CASES_REVIEW=PASS
CAUSAL_DAC_FIXTURE_REVIEW=PASS
NEGATIVE_ACTOR_FSUID_REVIEW=PASS
ACL_CLASS_BINDING_REVIEW=PASS
STICKY_BIT_EXCLUSION_REVIEW=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE=PASS
```

---

## 14. Acceptance criteria

This repair may become canonical only if review accepts all of:

```text
The predecessor's ACL textual-absence requirement is not observable with the authorized Node API surface.
Linux acl(5) distinguishes valid minimal/no-mask ACLs from extended/masked ACLs.
For an extended access ACL, group mode bits correspond to ACL_MASK and named-user/group effective rights are capped by that mask.
For a minimal access ACL without ACL_MASK, named ACL_USER/ACL_GROUP entries are absent and group mode bits correspond directly to ACL_GROUP_OBJ.
Linux pathname SOCK_STREAM connect requires write permission on the socket object.
Socket mode 0600 therefore proves zero non-owner socket write under either valid POSIX access-ACL branch.
Linux pathname creation/rename/unlink requires containing-directory write authority in addition to applicable path-search rules.
Ancestor group/other write bits of zero therefore prove zero non-owner directory-write rights under either valid POSIX access-ACL branch.
A full canonical uid_map/gid_map identity mapping is required so ordinary rootless namespace-relative UID/GID 0 is rejected.
CAP_CHOWN and CAP_FOWNER are explicitly excluded from the untrusted-principal theorem.
The negative fixture actor's filesystem UID is proven nonzero immediately before permission-behavior tests.
Every extended-ACL named ACL_USER qualifier used for denial equals that same negative actor filesystem UID.
Every minimal/no-mask ACL_GROUP_OBJ denial fixture owns the tested object with a group the same negative actor belongs to; nonmember/ACL_OTHER tests are separate and cannot satisfy the group-object proof.
Every denial directory proves S_ISVTX=0 so sticky-bit policy cannot explain unlink/rename denial.
The same actor passes positive controls and performs the corresponding denial operations.
Each socket denial uses a live listening socket with successful path search before expecting EACCES.
Each create/unlink/rename denial has exact reachable target/source preconditions and operation-specific EACCES.
Every denied mutation preserves the protected pathname identity and expected source/absence state.
A real extended-ACL physical fixture proves that requested named rights cannot escape the mask for socket connect or namespace mutation.
A separate minimal/no-mask baseline proves the direct ACL_GROUP_OBJ branch without inventing ACL_MASK.
The negative actor cannot mutate fixture ownership, mode, or ACL.
No ACL entry enumeration or mutation is needed in product runtime.
No new package dependency/helper is needed.
The implementation must not claim textual ACL absence.
Node geteuid/getegid are not misrepresented as fsuid/fsgid attestation.
Kernel denial of the live attach connection is fail-closed and never triggers permission repair/fallback.
Host DAC/ownership-bypass principals remain inside the trusted host boundary.
The exact predecessor document path and superseded clauses are unambiguous.
The document date is explicitly Asia/Riyadh and is not a future-dated precedence signal.
All non-ACL B2A constraints from canonical PR #133 remain unchanged.
B2A remains zero-start, zero-workload, and PRESTART_READY-only.
B2B remains separately unauthorized.
```

If independent review rejects the Linux POSIX ACL two-case/pathname-socket/host-ID-mapping derivation or identifies a filesystem/privilege case that invalidates it within the accepted B2A deployment theorem, implementation remains blocked and must return to authorization again.