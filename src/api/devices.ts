import apiClient from './client';
import type {
  AdamDevice,
  AdamCreateRequest,
  AdamHealth,
  AdamWithPins,
  SecondaryDevice,
  SecondaryDeviceCreate,
  SecondaryDeviceUpdate,
  PidsSensor,
  SensorRegister,
} from '../types/device';

export const listAdams = async (): Promise<AdamDevice[]> => {
  const { data } = await apiClient.get<AdamDevice[]>('/adams');
  return data;
};

export const createAdam = async (payload: AdamCreateRequest): Promise<AdamDevice> => {
  const { data } = await apiClient.post<AdamDevice>('/adams', payload);
  return data;
};

export const deleteAdam = async (alias: string): Promise<{ status: string; alias: string }> => {
  const { data } = await apiClient.delete<{ status: string; alias: string }>(`/adams/${alias}`);
  return data;
};

export const getAdamHealth = async (): Promise<AdamHealth[]> => {
  const { data } = await apiClient.get<AdamHealth[]>('/adams/health');
  return data;
};

export const getAdamPins = async (alias: string): Promise<AdamWithPins> => {
  const { data } = await apiClient.get<AdamWithPins>(`/adams/pins/${alias}`);
  return data;
};

export const listAdamDevices = async (adamAlias: string): Promise<SecondaryDevice[]> => {
  const { data } = await apiClient.get<SecondaryDevice[]>(`/adams/${adamAlias}/devices`);
  return data;
};

export const createSubDevice = async (payload: SecondaryDeviceCreate): Promise<SecondaryDevice> => {
  const { data } = await apiClient.post<SecondaryDevice>('/adams/device', payload);
  return data;
};

export const updateSubDevice = async (alias: string, payload: SecondaryDeviceUpdate): Promise<SecondaryDevice> => {
  const { data } = await apiClient.put<SecondaryDevice>(`/adams/device/${alias}`, payload);
  return data;
};

export const deleteSubDevice = async (alias: string): Promise<{ status: string; alias: string }> => {
  const { data } = await apiClient.delete<{ status: string; alias: string }>(`/adams/device/${alias}`);
  return data;
};

export const listSensors = async (): Promise<PidsSensor[]> => {
  const { data } = await apiClient.get<PidsSensor[]>('/sensors');
  return data;
};

export const createSensor = async (payload: SensorRegister): Promise<PidsSensor> => {
  const { data } = await apiClient.post<PidsSensor>('/sensor', payload);
  return data;
};

export const deleteSensor = async (alias: string): Promise<{ status: string; alias: string }> => {
  const { data } = await apiClient.delete<{ status: string; alias: string }>(`/sensor/${alias}`);
  return data;
};
