import { appendFile, mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import type { ExecutionReceipt } from "./receipt.ts"

export interface ReceiptLedger {
  append(receipt: ExecutionReceipt): Promise<void> | void
}

export class InMemoryReceiptLedger implements ReceiptLedger {
  readonly receipts: ExecutionReceipt[] = []

  append(receipt: ExecutionReceipt): void {
    this.receipts.push(receipt)
  }
}

export class JsonlReceiptLedger implements ReceiptLedger {
  readonly filePath: string

  constructor(filePath: string) {
    this.filePath = filePath
  }

  async append(receipt: ExecutionReceipt): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    await appendFile(this.filePath, `${JSON.stringify(receipt)}\n`, "utf8")
  }
}
