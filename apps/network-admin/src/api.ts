export type Network = { id: string; name: string; contact_email?: string };
export type Practice = { id: string; network_id: string; name: string; contact_email?: string };
export type Doctor = { id: string; practice_id: string; full_name: string; email?: string };
export type AuthoringBundle = { id: string; scope_type: 'network'|'practice'; scope_id: string; version_tag: string };

export const api = {
  listNetworks: async (): Promise<Network[]> => [{ id: 'net-1', name: 'Sample Infertility Network' }],
  createNetwork: async (_name: string) => ({ ok: true }),
  listPractices: async (_netId: string): Promise<Practice[]> => [{ id: 'prac-1', network_id: 'net-1', name: 'Bay GYN' }],
  listDoctors: async (_pracId: string): Promise<Doctor[]> => [{ id: 'doc-1', practice_id: 'prac-1', full_name: 'Dr. Lopez' }],
  listBundles: async (_scopeType: string, _scopeId: string): Promise<AuthoringBundle[]> => [{ id: 'b-1', scope_type: 'network', scope_id: 'net-1', version_tag: 'NET-ovf-v1.0.0' }]
};
