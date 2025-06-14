import { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { log } from '../utils/logger';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface Role {
  id: number;
  name: string;
  scope_required_fields: string[];
  scope_multiple_fields: string[];
}

export function useReferenceDropdowns() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [badanUsaha, setBadanUsaha] = useState<Record<string, string>>({});
  const [divisions, setDivisions] = useState<Record<string, string>>({});
  const [regions, setRegions] = useState<Record<string, string>>({});
  const [clusters, setClusters] = useState<Record<string, string>>({});
  const [roleScope, setRoleScope] = useState<{ required: string[]; multiple: string[] }>({ required: [], multiple: [] });

  // Fetch roles
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/role`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data: Role[]) => {
        log('[useReferenceDropdowns] roles:', data);
        setRoles(data);
      })
      .catch((err) => {
        log('[useReferenceDropdowns] Failed to fetch roles:', err);
        setRoles([]);
      });
  }, [token]);

  // Fetch badan usaha
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL}/badanusaha`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data: Record<string, string>) => {
        log('[useReferenceDropdowns] badanUsaha:', data);
        setBadanUsaha(data);
      })
      .catch((err) => {
        log('[useReferenceDropdowns] Failed to fetch badanusaha:', err);
        setBadanUsaha({});
      });
  }, [token]);

  const fetchDivisions = (badanUsahaId: string) => {
    if (!token) return;
    fetch(`${BASE_URL}/division?badan_usaha_id=${badanUsahaId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data: Record<string, string>) => {
        log('[useReferenceDropdowns] divisions:', data);
        setDivisions(data);
      })
      .catch((err) => {
        log('[useReferenceDropdowns] Failed to fetch divisions:', err);
        setDivisions({});
      });
  };

  const fetchRegions = (divisionId: string) => {
    if (!token) return;
    fetch(`${BASE_URL}/region?division_id=${divisionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data: Record<string, string>) => {
        log('[useReferenceDropdowns] regions:', data);
        setRegions(data);
      })
      .catch((err) => {
        log('[useReferenceDropdowns] Failed to fetch regions:', err);
        setRegions({});
      });
  };

  const fetchClusters = (regionId: string) => {
    if (!token) return;
    fetch(`${BASE_URL}/cluster?region_id=${regionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data: Record<string, string>) => {
        log('[useReferenceDropdowns] clusters:', data);
        setClusters(data);
      })
      .catch((err) => {
        log('[useReferenceDropdowns] Failed to fetch clusters:', err);
        setClusters({});
      });
  };

  const onRoleChange = (roleId: number) => {
    const role = roles.find((r) => r.id === roleId);
    setRoleScope({
      required: role?.scope_required_fields || [],
      multiple: role?.scope_multiple_fields || [],
    });
  };

  return {
    roles,
    badanUsaha,
    divisions,
    regions,
    clusters,
    fetchDivisions,
    fetchRegions,
    fetchClusters,
    onRoleChange,
    roleScope,
  };
}
