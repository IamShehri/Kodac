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

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
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

  dispose(value: ExtensionRegistrationReceipt): boolean {
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("registration receipt must be an object")
    const receiptValue = value as ExtensionRegistrationReceipt
    if (receiptValue.version !== KDO_H1_REGISTRATION_VERSION) throw new TypeError("unsupported extension registration receipt")
    if (!Number.isSafeInteger(receiptValue.registrationSerial) || receiptValue.registrationSerial < 1) {
      throw new TypeError("registration receipt serial is invalid")
    }
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
    return this.registrations.has(extensionId)
  }

  get(extensionId: string): ExtensionDescriptor | undefined {
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
    if (typeof capabilityId !== "string" || capabilityId.length === 0) throw new TypeError("capabilityId must not be empty")
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
