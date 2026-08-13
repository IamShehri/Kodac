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

export class ExtensionDescriptorRegistry {
  private readonly registrations = new Map<string, ActiveRegistration>()
  private nextRegistrationSerial = 1

  get contractVersion(): typeof KDO_H1_EXTENSION_CONTRACT_VERSION {
    return KDO_H1_EXTENSION_CONTRACT_VERSION
  }

  get size(): number {
    return this.registrations.size
  }
}
