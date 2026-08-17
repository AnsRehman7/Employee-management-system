import { useCallback, useEffect, useMemo, useState } from "react";
import { api, formatApiError } from "../context/api";

const titleCase = (value = "") =>
  String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/**
 * Roles are workspace data, so every dropdown and label reads them from the API
 * rather than from a hardcoded list.
 */
export const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { roles: result = [] } = await api.getRoles();
      setRoles(result);
      setError("");
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const assignableRoles = useMemo(() => roles.filter((role) => role.canAssign), [roles]);

  const labelFor = useCallback(
    (roleKey) => roles.find((role) => role.key === roleKey)?.name || titleCase(roleKey),
    [roles],
  );

  return { assignableRoles, error, labelFor, loading, reload, roles, setRoles };
};

export default useRoles;
