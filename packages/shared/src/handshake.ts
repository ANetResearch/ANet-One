export interface HelloMessage {
  type: "anet-hello";
  version: string;
  platform: string;
  arch: string;
  pid: number;
}

export interface HelloAckMessage {
  type: "anet-hello-ack";
  version: string;
  clientId: string;
}
