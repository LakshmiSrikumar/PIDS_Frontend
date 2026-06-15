import { useEffect, useState, useRef, useCallback } from 'react';
import type { AxiosError } from 'axios';
import {
  listAdams,
  createAdam,
  deleteAdam,
  getAdamHealth,
  listAdamDevices,
  createSubDevice,
  updateSubDevice,
  deleteSubDevice,
  listSensors,
  createSensor,
  deleteSensor,
} from '../api/devices';
import type {
  AdamDevice,
  AdamHealth,
  SecondaryDevice,
  SecondaryDeviceCreate,
  PidsSensor,
  DeviceType,
} from '../types/device';

function getErrMsg(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string }>;
  return axiosErr.response?.data?.detail ?? 'Operation failed';
}

function formatPinMapping(pinMapping: Record<string, string>): string {
  return Object.entries(pinMapping)
    .map(([pin, name]) => `Pin ${pin}: ${name}`)
    .join(' | ');
}

function parsePinMapping(str: string): { input_pins: number[]; pin_mapping: Record<string, string> } {
  const parts = str.split('|').map(s => s.trim()).filter(Boolean);
  const input_pins: number[] = [];
  const pin_mapping: Record<string, string> = {};
  for (const part of parts) {
    const match = part.match(/Pin\s+(\d+)\s*:\s*(.+)/);
    if (match) {
      const pinIdx = parseInt(match[1], 10);
      if (!input_pins.includes(pinIdx)) input_pins.push(pinIdx);
      pin_mapping[match[1]] = match[2].trim();
    }
  }
  return { input_pins, pin_mapping };
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface PinRow {
  tempId: string;
  pinIndex: number;
  alertName: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

const PIN_OPTIONS = Array.from({ length: 12 }, (_, i) => i);

export default function DeviceManagement() {
  const [adams, setAdams] = useState<AdamDevice[]>([]);
  const [sensors, setSensors] = useState<PidsSensor[]>([]);
  const [healthMap, setHealthMap] = useState<Record<string, AdamHealth>>({});
  const [subDevicesMap, setSubDevicesMap] = useState<Record<string, SecondaryDevice[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Register modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerType, setRegisterType] = useState<DeviceType>('pids');

  // ADAM register form
  const [adamName, setAdamName] = useState('');
  const [adamIp, setAdamIp] = useState('');
  const [adamUsername, setAdamUsername] = useState('');
  const [adamPassword, setAdamPassword] = useState('');

  // PIDS register form
  const [sensorName, setSensorName] = useState('');
  const [sensorIp, setSensorIp] = useState('');
  const [sensorPort, setSensorPort] = useState('');

  // Sub-device modal
  const [subDeviceModalOpen, setSubDeviceModalOpen] = useState(false);
  const [selectedAdamAlias, setSelectedAdamAlias] = useState<string | null>(null);
  const [selectedAdamName, setSelectedAdamName] = useState('');
  const [subDeviceName, setSubDeviceName] = useState('');
  const [pinRows, setPinRows] = useState<PinRow[]>([{ tempId: generateId(), pinIndex: 0, alertName: '' }]);

  // Inline edit state
  const [editingSubDevice, setEditingSubDevice] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPins, setEditPins] = useState('');

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'adam' | 'sensor'; alias: string; name: string } | null>(null);

  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const fetchSubDevices = useCallback(async (adamAlias: string) => {
    try {
      const devices = await listAdamDevices(adamAlias);
      setSubDevicesMap(prev => ({ ...prev, [adamAlias]: devices }));
    } catch {
      setSubDevicesMap(prev => ({ ...prev, [adamAlias]: [] }));
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [adamsData, sensorsData, healthData] = await Promise.all([
        listAdams(),
        listSensors(),
        getAdamHealth(),
      ]);
      setAdams(adamsData);
      setSensors(sensorsData);
      const hm: Record<string, AdamHealth> = {};
      healthData.forEach(h => { hm[h.alias] = h; });
      setHealthMap(hm);

      await Promise.all(adamsData.map(a => fetchSubDevices(a.alias)));
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubDevices, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getHealth = (alias: string): { color: string; label: string; pulse: boolean } => {
    const h = healthMap[alias];
    if (!h) return { color: 'bg-outline', label: 'Unknown', pulse: false };
    switch (h.health) {
      case 'healthy': return { color: 'bg-secondary', label: 'Healthy', pulse: true };
      case 'degraded': return { color: 'bg-yellow-500', label: 'Degraded', pulse: false };
      case 'offline': return { color: 'bg-error', label: 'Offline', pulse: false };
      default: return { color: 'bg-outline', label: 'Unknown', pulse: false };
    }
  };

  // ── Search filter ──
  const filteredAdams = adams.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.name.toLowerCase().includes(q)
      || a.alias.toLowerCase().includes(q)
      || a.ip_address.toLowerCase().includes(q);
  });

  const filteredSensors = sensors.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q)
      || s.alias.toLowerCase().includes(q)
      || s.ip_addr.toLowerCase().includes(q);
  });

  // ── Register modal ──
  const resetRegisterForms = () => {
    setAdamName('');
    setAdamIp('');
    setAdamUsername('');
    setAdamPassword('');
    setSensorName('');
    setSensorIp('');
    setSensorPort('');
    setRegisterType('pids');
  };

  const openRegisterModal = () => {
    resetRegisterForms();
    setRegisterModalOpen(true);
  };

  const handleRegisterAdam = async () => {
    if (!adamName.trim() || !adamIp.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    try {
      await createAdam({
        name: adamName.trim(),
        ip_address: adamIp.trim(),
        username: adamUsername.trim() || undefined,
        password: adamPassword || undefined,
      });
      showToast(`ADAM ${adamName} registered successfully.`);
      setRegisterModalOpen(false);
      await fetchData();
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    }
  };

  const handleRegisterSensor = async () => {
    if (!sensorName.trim() || !sensorIp.trim() || !sensorPort.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    try {
      await createSensor({
        name: sensorName.trim(),
        ip_addr: sensorIp.trim(),
        port_no: sensorPort.trim(),
      });
      showToast(`Sensor ${sensorName} registered successfully.`);
      setRegisterModalOpen(false);
      await fetchData();
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    }
  };

  const handleSaveRegister = () => {
    if (registerType === 'adam') return handleRegisterAdam();
    if (registerType === 'pids') return handleRegisterSensor();
    showToast('Camera registration is currently disabled.', 'error');
  };

  // ── Sub-device modal ──
  const openSubDeviceModal = (adamAlias: string, adamDisplayName: string) => {
    setSelectedAdamAlias(adamAlias);
    setSelectedAdamName(adamDisplayName);
    setSubDeviceName('');
    setPinRows([{ tempId: generateId(), pinIndex: 0, alertName: '' }]);
    setSubDeviceModalOpen(true);
  };

  const addPinRow = () => {
    setPinRows(prev => [...prev, { tempId: generateId(), pinIndex: 0, alertName: '' }]);
  };

  const deletePinRow = (tempId: string) => {
    setPinRows(prev => prev.filter(r => r.tempId !== tempId));
  };

  const updatePinRow = (tempId: string, field: 'pinIndex' | 'alertName', value: number | string) => {
    setPinRows(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
  };

  const handleSaveSubDevice = async () => {
    if (!subDeviceName.trim()) {
      showToast('Please enter a device name.', 'error');
      return;
    }
    if (!selectedAdamAlias) return;

    const input_pins: number[] = [];
    const pin_mapping: Record<string, string> = {};
    for (const row of pinRows) {
      if (row.alertName.trim()) {
        if (!input_pins.includes(row.pinIndex)) input_pins.push(row.pinIndex);
        pin_mapping[String(row.pinIndex)] = row.alertName.trim();
      }
    }

    if (input_pins.length === 0) {
      showToast('Please map at least one pin.', 'error');
      return;
    }

    const payload: SecondaryDeviceCreate = {
      adam_alias: selectedAdamAlias,
      name: subDeviceName.trim(),
      input_pins,
      pin_mapping,
    };

    try {
      await createSubDevice(payload);
      showToast(`Sub-device ${subDeviceName} created.`);
      setSubDeviceModalOpen(false);
      await fetchSubDevices(selectedAdamAlias);
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    }
  };

  // ── Inline edit sub-device ──
  const startEdit = (device: SecondaryDevice) => {
    setEditingSubDevice(device.alias);
    setEditName(device.name);
    setEditPins(formatPinMapping(device.pin_mapping));
  };

  const cancelEdit = () => {
    setEditingSubDevice(null);
    setEditName('');
    setEditPins('');
  };

  const saveEdit = async (device: SecondaryDevice) => {
    if (!editName.trim()) {
      showToast('Device name cannot be empty.', 'error');
      return;
    }
    const parsed = parsePinMapping(editPins);
    if (parsed.input_pins.length === 0) {
      showToast('Please provide valid pin mappings.', 'error');
      return;
    }
    try {
      await updateSubDevice(device.alias, {
        input_pins: parsed.input_pins,
        pin_mapping: parsed.pin_mapping,
      });
      showToast(`Sub-device ${editName} updated.`);
      setEditingSubDevice(null);
      if (selectedAdamAlias) await fetchSubDevices(selectedAdamAlias);
      // Find the parent ADAM alias from subDevicesMap
      for (const [adamAlias, devices] of Object.entries(subDevicesMap)) {
        if (devices.some(d => d.alias === device.alias)) {
          await fetchSubDevices(adamAlias);
          break;
        }
      }
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    }
  };

  const handleDeleteSubDevice = async (device: SecondaryDevice) => {
    try {
      await deleteSubDevice(device.alias);
      showToast(`Sub-device ${device.name} deleted.`);
      for (const [adamAlias, devices] of Object.entries(subDevicesMap)) {
        if (devices.some(d => d.alias === device.alias)) {
          await fetchSubDevices(adamAlias);
          break;
        }
      }
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    }
  };

  // ── Delete device confirmation ──
  const openDeleteModal = (type: 'adam' | 'sensor', alias: string, name: string) => {
    setDeleteTarget({ type, alias, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'adam') {
        await deleteAdam(deleteTarget.alias);
        showToast(`ADAM ${deleteTarget.name} deleted.`);
      } else {
        await deleteSensor(deleteTarget.alias);
        showToast(`Sensor ${deleteTarget.name} deleted.`);
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      showToast(getErrMsg(err), 'error');
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-container-padding">
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${t.type === 'success' ? 'bg-secondary text-on-secondary' : 'bg-error text-on-error'} px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto mb-2`}
          >
            <span className="material-symbols-outlined">{t.type === 'success' ? 'check_circle' : 'error'}</span>
            <span className="font-bold tracking-wide text-sm">{t.message}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-secondary animate-spin">refresh</span>
            <p className="text-on-surface-variant">Loading device inventory...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header & Action Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-gutter mb-stack-lg">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Device Inventory</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Manage and monitor hardware modules across the industrial grid.</p>
            </div>
            <div className="flex items-center gap-stack-md">
              <button
                onClick={openRegisterModal}
                className="bg-secondary text-on-secondary-container px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-secondary/10"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Register New Device
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-stack-lg">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">search</span>
              <input
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-full py-4 pl-12 pr-6 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all placeholder:text-outline/50"
                placeholder="Search by Device Name, IP, or Type..."
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Device List */}
          <div className="space-y-gutter">
            {/* ADAM Section */}
            {filteredAdams.length > 0 && (
              <>
                <div className="flex items-center gap-4 py-2 border-b border-outline-variant/20">
                  <span className="text-label-sm font-label-sm text-outline uppercase tracking-[0.2em]">ADAM Devices</span>
                </div>
                <div className="grid grid-cols-1 gap-stack-md">
                  {filteredAdams.map(adam => (
                    <div
                      key={adam.alias}
                      className="group bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden transition-all hover:border-secondary/40 hover:shadow-xl hover:shadow-secondary/5"
                    >
                      <div className="p-5 flex items-center justify-between gap-gutter flex-wrap">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center">
                            <span className="material-symbols-outlined text-secondary text-3xl">settings_input_component</span>
                          </div>
                          <div>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface">{adam.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary text-label-sm font-label-sm border border-secondary/20">ADAM-6050</span>
                              <span className="text-outline font-label-md text-label-md">•</span>
                              <span className="text-on-surface-variant font-label-md text-label-md">IP: {adam.ip_address}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-gutter">
                          <button
                            onClick={() => openSubDeviceModal(adam.alias, adam.name)}
                            className="flex items-center gap-1 px-4 py-2 bg-surface-container-highest text-on-surface hover:bg-surface-variant rounded-lg transition-colors border border-outline-variant/20"
                          >
                            <span className="material-symbols-outlined text-[18px]">add_link</span>
                            <span className="font-label-md text-label-md">Add Sub-device</span>
                          </button>
                          <div className="text-right hidden md:block">
                            <p className="text-label-sm font-label-sm text-outline uppercase tracking-wider mb-1">Status</p>
                            <div className="flex items-center gap-2 justify-end">
                              <span className={`w-2 h-2 rounded-full ${getHealth(adam.alias).color} ${getHealth(adam.alias).pulse ? 'status-pulse' : ''}`} />
                              <span className="text-on-surface font-body-md">{getHealth(adam.alias).label}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => openDeleteModal('adam', adam.alias, adam.name)}
                            className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Delete Device"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Sub-devices */}
                      <div className="border-t border-outline-variant/10 bg-surface-container-lowest/50 p-stack-md">
                        {(!subDevicesMap[adam.alias] || subDevicesMap[adam.alias].length === 0) && (
                          <p className="text-outline text-label-sm text-center py-2">No sub-devices configured. Click "Add Sub-device" to map pins.</p>
                        )}
                        {subDevicesMap[adam.alias]?.map(device => (
                          <div key={device.alias} className="flex flex-col gap-2 mb-2 sub-device-container animate-in fade-in slide-in-from-top-1">
                            {editingSubDevice === device.alias ? (
                              /* Edit Mode */
                              <div className="flex-col gap-3 p-4 bg-surface-container-high/60 rounded-lg border border-secondary/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-outline font-medium tracking-wider">Device Name</label>
                                    <input
                                      className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                                      type="text"
                                      value={editName}
                                      onChange={e => setEditName(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-outline font-medium tracking-wider">Pin Mappings (Pipe separated)</label>
                                    <input
                                      className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                                      type="text"
                                      value={editPins}
                                      onChange={e => setEditPins(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-2">
                                  <button
                                    onClick={cancelEdit}
                                    className="px-4 py-1.5 rounded text-label-md text-outline hover:text-on-surface transition-colors font-medium"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => saveEdit(device)}
                                    className="px-4 py-1.5 bg-secondary text-on-secondary-container rounded text-label-md hover:brightness-110 transition-all font-medium"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* View Mode */
                              <div className="flex items-center justify-between p-3 bg-surface-container-low/40 rounded-lg border border-outline-variant/10">
                                <div className="flex items-center gap-3">
                                  <span className="material-symbols-outlined text-secondary text-[20px]">account_tree</span>
                                  <div>
                                    <p className="text-on-surface font-medium text-body-md">{device.name}</p>
                                    <p className="text-outline text-label-sm">{formatPinMapping(device.pin_mapping)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-[10px] font-medium uppercase tracking-wider">Linked</span>
                                  <button
                                    onClick={() => startEdit(device)}
                                    className="p-1 text-outline hover:text-secondary hover:bg-secondary/10 rounded transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubDevice(device)}
                                    className="p-1 text-outline hover:text-error transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* PIDS Section */}
            {filteredSensors.length > 0 && (
              <>
                <div className="flex items-center gap-4 py-2 border-b border-outline-variant/20 mt-6">
                  <span className="text-label-sm font-label-sm text-outline uppercase tracking-[0.2em]">PIDS Sensors</span>
                </div>
                <div className="grid grid-cols-1 gap-stack-md">
                  {filteredSensors.map(sensor => (
                    <div
                      key={sensor.alias}
                      className="group bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden transition-all hover:border-secondary/40 hover:shadow-xl hover:shadow-secondary/5"
                    >
                      <div className="p-5 flex items-center justify-between gap-gutter">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center">
                            <span className="material-symbols-outlined text-secondary text-3xl">sensors</span>
                          </div>
                          <div>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface">{sensor.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary text-label-sm font-label-sm border border-tertiary/20">PIDS Sensor</span>
                              <span className="text-outline font-label-md text-label-md">•</span>
                              <span className="text-on-surface-variant font-label-md text-label-md">IP: {sensor.ip_addr} : Port {sensor.port_no}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-gutter">
                          <div className="text-right hidden md:block">
                            <p className="text-label-sm font-label-sm text-outline uppercase tracking-wider mb-1">Status</p>
                            <div className="flex items-center gap-2 justify-end">
                              <span className={`w-2 h-2 rounded-full ${sensor.comm_status === 'connected' ? 'bg-secondary status-pulse' : 'bg-error'}`} />
                              <span className="text-on-surface font-body-md">{sensor.comm_status === 'connected' ? 'Connected' : 'Disconnected'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => openDeleteModal('sensor', sensor.alias, sensor.name)}
                            className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Delete Device"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {filteredAdams.length === 0 && filteredSensors.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-outline mb-4">router</span>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">No Devices Found</h3>
                <p className="text-on-surface-variant">
                  {searchQuery ? 'No devices match your search query.' : 'Register a new device to get started.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODAL: Register New Device ── */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setRegisterModalOpen(false)} />
          <div className="relative w-full max-w-lg mx-4">
            <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl glass-panel overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-on-surface">Register Device</h3>
                <button onClick={() => setRegisterModalOpen(false)} className="text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 pb-2 space-y-stack-md">
                {/* Type Selector */}
                <div>
                  <label className="font-label-sm text-label-sm text-outline uppercase mb-2 block">Hardware Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['adam', 'pids', 'cam'] as DeviceType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setRegisterType(type)}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                          registerType === type
                            ? 'border-secondary bg-secondary/10 text-secondary'
                            : 'border-outline-variant/30 text-outline hover:border-secondary/50'
                        }`}
                      >
                        <span className="material-symbols-outlined">
                          {type === 'adam' ? 'settings_input_component' : type === 'pids' ? 'sensors' : 'videocam'}
                        </span>
                        <span className="text-label-sm">{type === 'adam' ? 'ADAM' : type === 'pids' ? 'PIDS' : 'CAMERA'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ADAM Form */}
                {registerType === 'adam' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-label-sm text-outline">Device Name</label>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                          placeholder="adam_nort"
                          type="text"
                          value={adamName}
                          onChange={e => setAdamName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-sm text-outline">IP Address</label>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                          placeholder="192.168.1.105"
                          type="text"
                          value={adamIp}
                          onChange={e => setAdamIp(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-label-sm text-outline">Username</label>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                          placeholder="admin"
                          type="text"
                          value={adamUsername}
                          onChange={e => setAdamUsername(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-sm text-outline">Password</label>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                          placeholder="••••"
                          type="password"
                          value={adamPassword}
                          onChange={e => setAdamPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PIDS Form */}
                {registerType === 'pids' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <label className="text-label-sm text-outline">Sensor Name</label>
                      <input
                        className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                        placeholder="Perimeter_Segment_A"
                        type="text"
                        value={sensorName}
                        onChange={e => setSensorName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-label-sm text-outline">IP Address</label>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                          placeholder="10.0.X.X"
                          type="text"
                          value={sensorIp}
                          onChange={e => setSensorIp(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-sm text-outline">Port Number</label>
                        <input
                          className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                          placeholder="8080"
                          type="text"
                          value={sensorPort}
                          onChange={e => setSensorPort(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Camera Placeholder */}
                {registerType === 'cam' && (
                  <div className="py-4 text-center animate-in fade-in duration-300">
                    <span className="material-symbols-outlined text-4xl text-outline mb-2">videocam_off</span>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface">VMS API Link Required</h4>
                    <p className="text-body-md text-outline px-8">Managed via Aegis VMS Gateway. Direct registration pending v2.5.0.</p>
                  </div>
                )}
              </div>

              <div className="p-6 pt-4 bg-surface-container-highest/30 border-t border-outline-variant/20 flex gap-stack-md">
                <button
                  onClick={() => setRegisterModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-variant transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRegister}
                  className="flex-1 py-2.5 rounded-lg bg-secondary text-on-secondary-container hover:brightness-110 transition-all font-medium"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Sub-device ── */}
      {subDeviceModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setSubDeviceModalOpen(false)} />
          <div className="relative w-full max-w-lg mx-4">
            <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl glass-panel overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-on-surface">Add Sub-device</h3>
                <button onClick={() => setSubDeviceModalOpen(false)} className="text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-label-sm text-outline uppercase">Adam Alias</label>
                  <input
                    className="w-full bg-surface-variant/30 border border-outline-variant/20 rounded-lg py-2 px-3 text-body-md text-outline cursor-not-allowed"
                    type="text"
                    readOnly
                    value={selectedAdamName}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-label-sm text-outline uppercase">Device Name</label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg py-2 px-3 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/30 outline-none transition-all"
                    placeholder="e.g. Perimeter_Zone_A"
                    type="text"
                    value={subDeviceName}
                    onChange={e => setSubDeviceName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-label-sm text-outline uppercase">Pin Mapping</label>
                  <div className="border border-outline-variant/20 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container-highest text-label-sm text-outline uppercase">
                        <tr>
                          <th className="px-3 py-2 border-b border-outline-variant/20 w-24">Pin</th>
                          <th className="px-3 py-2 border-b border-outline-variant/20">Alert Name</th>
                          <th className="px-3 py-2 border-b border-outline-variant/20 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {pinRows.map(row => (
                          <tr key={row.tempId} className="border-b border-outline-variant/10">
                            <td className="px-2 py-2">
                              <select
                                className="bg-surface-container-lowest border border-outline-variant/40 rounded px-2 py-1 text-body-md w-full focus:ring-1 focus:ring-secondary/30 outline-none"
                                value={row.pinIndex}
                                onChange={e => updatePinRow(row.tempId, 'pinIndex', parseInt(e.target.value, 10))}
                              >
                                {PIN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <input
                                className="bg-surface-container-lowest border border-outline-variant/40 rounded px-2 py-1 text-body-md w-full focus:ring-1 focus:ring-secondary/30 outline-none"
                                placeholder="Alert Name"
                                type="text"
                                value={row.alertName}
                                onChange={e => updatePinRow(row.tempId, 'alertName', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                onClick={() => deletePinRow(row.tempId)}
                                className="text-outline hover:text-error transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      onClick={addPinRow}
                      className="w-full py-2 text-label-md text-secondary hover:bg-secondary/10 transition-colors border-t border-outline-variant/20 flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span> Add Row
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-container-highest border-t border-outline-variant/20 flex gap-stack-md">
                <button
                  onClick={() => setSubDeviceModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-variant transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubDevice}
                  className="flex-1 py-2.5 rounded-lg bg-secondary text-on-secondary-container hover:brightness-110 transition-all font-medium"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirmation ── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => { setDeleteModalOpen(false); setDeleteTarget(null); }} />
          <div className="relative w-full max-w-md mx-4">
            <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl glass-panel overflow-hidden">
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <h3 className="font-headline-md text-headline-md text-on-surface">Confirm Deletion</h3>
                <button onClick={() => { setDeleteModalOpen(false); setDeleteTarget(null); }} className="text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6">
                <p className="text-body-md text-on-surface-variant">
                  Are you sure you want to remove <span className="font-bold text-on-surface">{deleteTarget?.name}</span> and all its associated data? This action cannot be undone.
                </p>
              </div>
              <div className="p-6 bg-surface-container-highest border-t border-outline-variant/20 flex gap-stack-md">
                <button
                  onClick={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}
                  className="flex-1 py-2.5 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-variant transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-lg bg-error text-on-error-container hover:brightness-110 transition-all font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
