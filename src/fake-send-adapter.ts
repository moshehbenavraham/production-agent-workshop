import {
  isFakeSendAdapterOutcome,
  isFakeSendCommand,
  makeFakeSendFailure,
  type FakeSendAdapter,
  type FakeSendAdapterOutcome,
  type FakeSendCommand,
} from "./fake-send.js";

export class DeterministicFakeSendAdapter implements FakeSendAdapter {
  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  async execute(command: FakeSendCommand, signal: AbortSignal): Promise<FakeSendAdapterOutcome> {
    if (signal.aborted || !isFakeSendCommand(command)) {
      return {
        ok: false,
        status: "downstream_failure",
        error: makeFakeSendFailure("downstream_failure"),
      };
    }
    try {
      const outcome: unknown = {
        ok: true,
        status: "accepted",
        receiptId: `fake_receipt_${command.idempotencyKey.slice(0, 24)}`,
        acceptedAt: this.now(),
      };
      return isFakeSendAdapterOutcome(outcome)
        ? outcome
        : {
            ok: false,
            status: "downstream_failure",
            error: makeFakeSendFailure("downstream_failure"),
          };
    } catch {
      return {
        ok: false,
        status: "downstream_failure",
        error: makeFakeSendFailure("downstream_failure"),
      };
    }
  }
}
