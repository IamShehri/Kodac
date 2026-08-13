import {
  KDO_H1_EXTENSION_CONTRACT_VERSION,
  KDO_H1_EXTENSION_ROLES,
  type ExtensionCapabilityRole,
  type ExtensionDescriptor,
  validateExtensionDescriptor,
} from "./contracts.ts"

export const KDO_H1_REGISTRATION_VERSION = "kodac-extension-registration-v1" as const

export interface ExtensionRegistrationReceipt {
  readonly version: typeof KDO_H1_REGISTRATION_VERSION
  readonly extensionId: string
  readonly descriptorIdentity: string
  readonly registrationSerial: number
}

interface ActiveRegistration {
  readonly descriptor: ExtensionDescriptor
  readonly registrationSerial: number
}

const RECEIPT_KEYS = ["version", "extensionId", "descriptorIdentity", "registrationSerial"] as const
const SHA256 = /^[0-9a-f]{64}$/
const EXTENSION_ID = /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/
const CAPABILITY_ID = /^[a-z][a-z0-9_-]*(?:[./:][a-z][a-z0-9_-]*)+$/

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) {
    if (!allowedSet.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
  }
}

function cloneDescriptor(descriptor: ExtensionDescriptor): ExtensionDescriptor {
  return Object.freeze({
    ...descriptor,
    provenance: Object.freeze({ ...descriptor.provenance }),
    capabilities: Object.freeze(
      descriptor.capabilities.map((entry) => Object.freeze({
        capabilityId: entry.capabilityId,
        roles: Object.freeze([...entry.roles]),
      })),
    ),
  })
}

function receipt(extensionId: string, registration: ActiveRegistration): ExtensionRegistrationReceipt {
  return Object.freeze({
    version: KDO_H1_REGISTRATION_VERSION,
    extensionId,
    descriptorIdentity: registration.descriptor.descriptorIdentity,
    registrationSerial: registration.registrationSerial,
  })
}

export function validateExtensionRegistrationReceipt(value: unknown): ExtensionRegistrationReceipt {
  const record = asRecord(value, "extension registration receipt")
  exactKeys(record, RECEIPT_KEYS, "extension registration receipt")
  if (record.version !== KDO_H1_REGISTRATION_VERSION) throw new TypeError("unsupported extension registration receipt")
  if (typeof record.extensionId !== "string" || !EXTENSION_ID.test(record.extensionId)) throw new TypeError("registration receipt extension id is invalid")
  if (typeof record.descriptorIdentity !== "string" || !SHA256.test(record.descriptorIdentity)) throw new TypeError("registration receipt descriptor identity is invalid")
  if (!Number.isSafeInteger(record.registrationSerial) || (record.registrationSerial as number) < 1) throw new TypeError("registration receipt serial is invalid")
  return Object.freeze({
    version: KDO_H1_REGISTRATION_VERSION,
    extensionId: record.extensionId,
    descriptorIdentity: record.descriptorIdentity,
    registrationSerial: record.registrationSerial as number,
  })
}

function validateRole(value: ExtensionCapabilityRole | undefined): ExtensionCapabilityRole | undefined {
  if (value === undefined) return undefined
  if (!KDO_H1_EXTENSION_ROLES.includes(value)) throw new TypeError("unsupported extension capability role")
  return value
}

export class ExtensionDescriptorRegistry {
  private readonly registrations = new Map<string, ActiveRegistration>()
  private nextRegistrationSerial = 1

  get contractVersion(): typeof KDO_H1_EXTENSION_CONTRACT_VERSION {
    return KDO_H1_EXTENSION_CONTRACT_VERSION
  }

  get size(): number {
    return this.registrations.size
  }

  register(value: unknown): ExtensionRegistrationReceipt {
    const descriptor = validateExtensionDescriptor(value)
    if (this.registrations.has(descriptor.extensionId)) {
      throw new TypeError(`extension already registered: ${descriptor.extensionId}`)
    }
    if (!Number.isSafeInteger(this.nextRegistrationSerial) || this.nextRegistrationSerial < 1) {
      throw new RangeError("extension registration serial exhausted")
    }
    const registration = Object.freeze({
      descriptor: cloneDescriptor(descriptor),
      registrationSerial: this.nextRegistrationSerial,
    })
    this.nextRegistrationSerial += 1
    this.registrations.set(descriptor.extensionId, registration)
    return receipt(descriptor.extensionId, registration)
  }

  dispose(value: unknown): boolean {
    const receiptValue = validateExtensionRegistrationReceipt(value)
    const current = this.registrations.get(receiptValue.extensionId)
    if (current === undefined) return false
    if (
      current.registrationSerial !== receiptValue.registrationSerial ||
      current.descriptor.descriptorIdentity !== receiptValue.descriptorIdentity
    ) {
      return false
    }
    this.registrations.delete(receiptValue.extensionId)
    return true
  }

  has(extensionId: string): boolean {
    if (!EXTENSION_ID.test(extensionId)) throw new TypeError("invalid extension id")
    return this.registrations.has(extensionId)
  }

  get(extensionId: string): ExtensionDescriptor | undefined {
    if (!EXTENSION_ID.test(extensionId)) throw new TypeError("invalid extension id")
    const registration = this.registrations.get(extensionId)
    return registration === undefined ? undefined : cloneDescriptor(registration.descriptor)
  }

  list(): readonly ExtensionDescriptor[] {
    return Object.freeze(
      [...this.registrations.values()]
        .map((registration) => cloneDescriptor(registration.descriptor))
        .sort((a, b) => compareStrings(a.extensionId, b.extensionId)),
    )
  }

  findByCapability(capabilityId: string, role?: ExtensionCapabilityRole): readonly ExtensionDescriptor[] {
    if (!CAPABILITY_ID.test(capabilityId)) throw new TypeError("invalid capability id")
    const normalizedRole = validateRole(role)
    return Object.freeze(
      [...this.registrations.values()]
        .map((registration) => registration.descriptor)
        .filter((descriptor) => descriptor.capabilities.some((entry) =>
          entry.capabilityId === capabilityId && (normalizedRole === undefined || entry.roles.includes(normalizedRole)),
        ))
        .map(cloneDescriptor)
        .sort((a, b) => compareStrings(a.extensionId, b.extensionId)),
    )
  }
}
