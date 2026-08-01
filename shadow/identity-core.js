// Identity Core (blueprint §3) — manages identities, roles, rights and context.
// Every entity in the USUP (user, module, wabe) is registered here. This is real,
// executable state used by the Hyperkernel and Arbeiterinnen to enforce access.

export function createIdentityCore() {
  /** @type {Map<string, object>} */
  const entities = new Map();

  function register(entity = {}) {
    const id = entity.id || `id-${Date.now().toString(36)}-${entities.size + 1}`;
    const record = {
      id,
      kind: entity.kind || 'entity', // user | module | wabe
      label: entity.label || id,
      roles: new Set(Array.isArray(entity.roles) ? entity.roles : []),
      permissions: new Set(Array.isArray(entity.permissions) ? entity.permissions : []),
      context: entity.context || {},
      createdAt: new Date().toISOString()
    };
    entities.set(id, record);
    return { id, kind: record.kind, label: record.label };
  }

  function assignRole(id, role) {
    const e = entities.get(id);
    if (!e) return null;
    e.roles.add(role);
    return [...e.roles];
  }

  function setPermissions(id, permissions = []) {
    const e = entities.get(id);
    if (!e) return null;
    e.permissions = new Set(permissions);
    return [...e.permissions];
  }

  function can(id, permission) {
    const e = entities.get(id);
    return Boolean(e && e.permissions.has(permission));
  }

  function getContext(id) {
    const e = entities.get(id);
    if (!e) return null;
    return { id: e.id, kind: e.kind, label: e.label, roles: [...e.roles], permissions: [...e.permissions], context: e.context };
  }

  function list() {
    return [...entities.values()].map((e) => ({ id: e.id, kind: e.kind, label: e.label, roles: [...e.roles] }));
  }

  // Blueprint method names (§3) as aliases, so the document maps 1:1 to code.
  return {
    register,
    assign_role: assignRole,
    set_permissions: setPermissions,
    get_context: getContext,
    can,
    list,
    count() { return entities.size; }
  };
}
