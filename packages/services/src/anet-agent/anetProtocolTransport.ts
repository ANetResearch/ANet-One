import type { Event, IDisposable } from "@anet/rpc";
import type { ANetProtocolMessage } from "@anet/shared";

export type ANetProtocolTransportKind = "stdio" | "websocket" | "memory";

export interface ANetProtocolTransportClosedEvent {
  code?: number | null;
  signal?: NodeJS.Signals | null;
  reason?: string;
}

export interface ANetProtocolTransport extends IDisposable {
  readonly kind: ANetProtocolTransportKind;
  readonly onMessage: Event<ANetProtocolMessage>;
  readonly onClose: Event<ANetProtocolTransportClosedEvent>;
  send(message: ANetProtocolMessage): Promise<void>;
  disposeAndWait?(): Promise<void>;
}
