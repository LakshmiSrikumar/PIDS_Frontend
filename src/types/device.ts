export interface AdamDevice {
  id: string;
  alias: string;
  name: string;
  ip_address: string;
  status: string;
  poll_interval_ms: number;
}

export interface AdamCreateRequest {
  name: string;
  ip_address: string;
  username?: string;
  password?: string;
}

export interface AdamHealth {
  alias: string;
  status: string;
  health: 'healthy' | 'degraded' | 'offline' | 'unknown';
  last_seen: string | null;
  latency_ms: number | null;
  missed_polls: number;
  poll_interval_ms: number;
}

export interface AdamPin {
  pin_type: string;
  pin_index: number;
  current_value: number;
}

export interface AdamWithPins {
  adam: AdamDevice;
  pins: AdamPin[];
}

export interface SecondaryDevice {
  id: string;
  adam_id: string;
  name: string;
  alias: string;
  input_pins: number[];
  pin_mapping: Record<string, string>;
}

export interface SecondaryDeviceCreate {
  adam_alias: string;
  name: string;
  input_pins: number[];
  pin_mapping: Record<string, string>;
}

export interface SecondaryDeviceUpdate {
  input_pins: number[];
  pin_mapping: Record<string, string>;
}

export interface PidsSensor {
  id: string;
  alias: string;
  name: string;
  ip_addr: string;
  port_no: string;
  comm_status: string;
}

export interface SensorRegister {
  name: string;
  ip_addr: string;
  port_no: string;
}

export type DeviceType = 'adam' | 'pids' | 'cam';
