// File: rbac.ts
import { EventEmitter } from 'events';

import * as ipaddr from 'ipaddr.js';

export type Permission = string;
export type Role = string;
export type PrincipalId = string;
export type GroupId = string;

export interface Principal {
  id: PrincipalId;
  type: 'user' | 'service' | 'group';
}

export interface User extends Principal {
  type: 'user';
  username: string;
}

export interface Group extends Principal {
  type: 'group';
  name: string;
  members: Set<PrincipalId>;
  subgroups: Set<GroupId>;
}

/**
 * Represents a role in the RBAC system.
 */
interface RoleDefinition {
  name: Role;
  permissions: Set<Permission>;
  inherits?: Role[];
}

/**
 * Interface for conditional permission checkers.
 */
export interface ConditionChecker {
  check(principalId: PrincipalId, permission: Permission, context?: any): boolean;
}

/**
 * Time-based condition checker implementation.
 */
export class TimeBasedChecker implements ConditionChecker {
  private startTime: number;
  private endTime: number;

  constructor(startTime: number, endTime: number) {
    this.startTime = startTime;
    this.endTime = endTime;
  }

  check(principalId: PrincipalId, permission: Permission): boolean {
    const currentHour = new Date().getHours();
    return currentHour >= this.startTime && currentHour < this.endTime;
  }
}

/**
 * IP-based condition checker implementation.
 */
export class IPBasedChecker implements ConditionChecker {
  private allowedIPs: Set<string>;

  constructor(allowedIPs: string[]) {
    this.allowedIPs = new Set(allowedIPs);
  }

  check(principalId: PrincipalId, permission: Permission, context?: { ip: string }): boolean {
    if (!context || !context.ip) {
      return false; // If no IP is provided in the context, deny access
    }
    return this.allowedIPs.has(context.ip);
  }
}

/**
 * Advanced IP-based condition checker implementation.
 */
export class AdvancedIPChecker implements ConditionChecker {
  private allowedIPs: Set<string>;
  private allowedSubnets: Array<[ipaddr.IPv4 | ipaddr.IPv6, number]>;
  private blockedIPs: Set<string>;
  private blockedSubnets: Array<[ipaddr.IPv4 | ipaddr.IPv6, number]>;

  constructor(
    allowedIPs: string[] = [],
    allowedSubnets: string[] = [],
    blockedIPs: string[] = [],
    blockedSubnets: string[] = []
  ) {
    this.allowedIPs = new Set(allowedIPs);
    this.allowedSubnets = this.parseSubnets(allowedSubnets);
    this.blockedIPs = new Set(blockedIPs);
    this.blockedSubnets = this.parseSubnets(blockedSubnets);
  }

  private parseSubnets(subnets: string[]): Array<[ipaddr.IPv4 | ipaddr.IPv6, number]> {
    return subnets.map(subnet => {
      const [ip, mask] = subnet.split('/');
      return [ipaddr.parse(ip), parseInt(mask, 10)];
    });
  }

  private isIPInSubnet(ip: ipaddr.IPv4 | ipaddr.IPv6, subnet: [ipaddr.IPv4 | ipaddr.IPv6, number]): boolean {
    return ip.kind() === subnet[0].kind() && ip.match(subnet[0], subnet[1]);
  }

  check(principalId: PrincipalId, permission: Permission, context?: { ip: string }): boolean {
    if (!context || !context.ip) {
      return false; // If no IP is provided in the context, deny access
    }

    const ip = ipaddr.parse(context.ip);

    // Check if the IP is explicitly blocked
    if (this.blockedIPs.has(context.ip)) {
      return false;
    }

    // Check if the IP is in a blocked subnet
    if (this.blockedSubnets.some(subnet => this.isIPInSubnet(ip, subnet))) {
      return false;
    }

    // If there are no allowed IPs or subnets, allow by default
    if (this.allowedIPs.size === 0 && this.allowedSubnets.length === 0) {
      return true;
    }

    // Check if the IP is explicitly allowed
    if (this.allowedIPs.has(context.ip)) {
      return true;
    }

    // Check if the IP is in an allowed subnet
    return this.allowedSubnets.some(subnet => this.isIPInSubnet(ip, subnet));
  }
}

/**
 * Represents an entry in the audit log.
 */
export interface AuditLogEntry {
  timestamp: Date;
  principalId: PrincipalId;
  permission: Permission;
  granted: boolean;
  context?: any;
  reason: string;
}

/**
 * Interface for audit loggers.
 */
export interface AuditLogger {
  log(entry: AuditLogEntry): void;
}

/**
 * A simple console-based audit logger implementation.
 */
export class ConsoleAuditLogger implements AuditLogger {
  log(entry: AuditLogEntry): void {
    console.log(JSON.stringify(entry, null, 2));
  }
}

/**
 * Audit event emitter for RBAC system.
 */
export class AuditEventEmitter extends EventEmitter {
  emitPermissionCheck(logEntry: AuditLogEntry) {
    this.emit('permissionCheck', logEntry);
  }

  emitRoleAssignment(principalId: PrincipalId, role: Role) {
    this.emit('roleAssignment', { principalId, role, timestamp: new Date() });
  }

  emitRoleRevocation(principalId: PrincipalId, role: Role) {
    this.emit('roleRevocation', { principalId, role, timestamp: new Date() });
  }

  emitPrincipalAddition(principal: Principal) {
    this.emit('principalAddition', { principal, timestamp: new Date() });
  }

  emitPrincipalRemoval(principalId: PrincipalId) {
    this.emit('principalRemoval', { principalId, timestamp: new Date() });
  }

  emitRoleCreation(role: Role, permissions: Permission[]) {
    this.emit('roleCreation', { role, permissions, timestamp: new Date() });
  }

  /**
   * Emits an event when a role is removed from the system.
   * @param role - The role that was removed.
   */
  emitRoleRemoval(role: Role) {
    this.emit('roleRemoval', { role, timestamp: new Date() });
  }

  emitGroupCreation(groupId: GroupId, name: string) {
    this.emit('groupCreation', { groupId, name, timestamp: new Date() });
  }

  emitGroupAddition(groupId: GroupId, principalId: PrincipalId) {
    this.emit('groupAddition', { groupId, principalId, timestamp: new Date() });
  }

  emitGroupRemoval(groupId: GroupId, principalId: PrincipalId) {
    this.emit('groupRemoval', { groupId, principalId, timestamp: new Date() });
  }

  emitPermissionDenial(principalId: PrincipalId, permission: Permission) {
    this.emit('permissionDenial', { principalId, permission, timestamp: new Date() });
  }

  emitPermissionDenialRemoval(principalId: PrincipalId, permission: Permission) {
    this.emit('permissionDenialRemoval', { principalId, permission, timestamp: new Date() });
  }

  emitConditionAddition(principalId: PrincipalId, permission: Permission, conditionType: string) {
    this.emit('conditionAddition', { principalId, permission, conditionType, timestamp: new Date() });
  }
}

/**
 * Options for configuring the RBAC system.
 */
export interface RBACOptions {
  auditLogger?: AuditLogger;
  logLevel?: 'none' | 'basic' | 'detailed';
}

/**
 * Role-Based Access Control (RBAC) system with support for negative and conditional permissions, and auditing.
 * Manages roles, permissions, principals (users, services, groups), and their relationships.
 */
export class RBAC {
  private roles: Map<Role, RoleDefinition>;
  private principalRoles: Map<PrincipalId, Set<Role>>;
  private principals: Map<PrincipalId, Principal>;
  private groups: Map<GroupId, Group>;
  private negativePermissions: Map<PrincipalId, Set<Permission>>;
  private conditionCheckers: Map<PrincipalId, Map<Permission, ConditionChecker[]>>;
  private logLevel: 'none' | 'basic' | 'detailed';
  public auditEmitter: AuditEventEmitter;

  /**
   * Initializes a new instance of the RBAC class.
   */
  constructor(options?: RBACOptions) {
    this.roles = new Map();
    this.principalRoles = new Map();
    this.principals = new Map();
    this.groups = new Map();
    this.negativePermissions = new Map();
    this.conditionCheckers = new Map();
    this.logLevel = options?.logLevel ?? 'none';
    this.auditEmitter = new AuditEventEmitter();
  }

  /**
   * Sets or updates RBAC options.
   * @param options - The options to set or update.
   */
  setOptions(options: RBACOptions): void {
    if (options.logLevel !== undefined) {
      this.logLevel = options.logLevel;
    }
  }
  
  /**
   * Adds a new role with associated permissions and optional inheritance.
   * @param role - The name of the role to add.
   * @param permissions - An array of permissions to associate with the role.
   * @param inherits - An optional array of roles that this role inherits from.
   */
  addRole(role: Role, permissions: Permission[], inherits?: Role[]): void {
    this.roles.set(role, {
      name: role,
      permissions: new Set(permissions),
      inherits: inherits
    });
    this.auditEmitter.emitRoleCreation(role, permissions);
  }

  /**
   * Removes a role from the system.
   * @param role - The name of the role to remove.
   * @returns True if the role was removed, false if it didn't exist.
   */
  removeRole(role: Role): boolean {
    if (this.roles.delete(role)) {
      // Remove the role from all principals
      for (const [principalId, roles] of this.principalRoles) {
        if (roles.delete(role)) {
          this.auditEmitter.emitRoleRevocation(principalId, role);
        }
      }
      // Remove the role from inheritance of other roles
      for (const roleDefinition of this.roles.values()) {
        if (roleDefinition.inherits) {
          const index = roleDefinition.inherits.indexOf(role);
          if (index > -1) {
            roleDefinition.inherits.splice(index, 1);
          }
        }
      }
      this.auditEmitter.emitRoleRemoval(role);
      return true;
    }
    return false;
  }

  /**
   * Adds a new principal (user, service, or group) to the system.
   * @param principal - The principal object to add.
   */
  addPrincipal(principal: Principal): void {
    this.principals.set(principal.id, principal);
    this.auditEmitter.emitPrincipalAddition(principal);
  }

  /**
   * Removes a principal from the system.
   * @param principalId - The ID of the principal to remove.
   * @returns True if the principal was removed, false if it didn't exist.
   */
  removePrincipal(principalId: PrincipalId): boolean {
    if (this.principals.delete(principalId)) {
      this.auditEmitter.emitPrincipalRemoval(principalId);
      return true;
    }
    return false;
  }

  /**
   * Assigns a role to a principal.
   * @param principalId - The ID of the principal.
   * @param role - The role to assign.
   * @throws Error if the principal does not exist.
   */
  assignRole(principalId: PrincipalId, role: Role): void {
    if (!this.principals.has(principalId)) {
      throw new Error(`Principal with id ${principalId} does not exist`);
    }
    if (!this.principalRoles.has(principalId)) {
      this.principalRoles.set(principalId, new Set());
    }
    this.principalRoles.get(principalId)!.add(role);
    this.auditEmitter.emitRoleAssignment(principalId, role);
  }

  /**
   * Revokes a role from a principal.
   * @param principalId - The ID of the principal.
   * @param role - The role to revoke.
   * @returns True if the role was revoked, false if the principal didn't have the role.
   */
  revokeRole(principalId: PrincipalId, role: Role): boolean {
    const roles = this.principalRoles.get(principalId);
    if (roles && roles.delete(role)) {
      this.auditEmitter.emitRoleRevocation(principalId, role);
      return true;
    }
    return false;
  }

  /**
   * Gets all roles associated with a principal, including inherited roles from groups.
   * @param principalId - The ID of the principal to get roles for.
   * @returns A set of all roles associated with the principal.
   */
  private getPrincipalRoles(principalId: PrincipalId): Set<Role> {
    const roles = new Set<Role>();
    const directRoles = this.principalRoles.get(principalId);
    if (directRoles) {
      directRoles.forEach(role => roles.add(role));
    }

    const principal = this.principals.get(principalId);
    if (principal && principal.type === 'group') {
      this.getGroupRoles(principal as Group, roles);
    } else {
      this.getMemberOfGroupsRoles(principalId, roles);
    }

    return roles;
  }

  /**
   * Recursively gets all roles associated with a group and its subgroups.
   * @param group - The group to get roles for.
   * @param roles - A set to accumulate roles into.
   */
  private getGroupRoles(group: Group, roles: Set<Role>): void {
    const groupRoles = this.principalRoles.get(group.id);
    if (groupRoles) {
      groupRoles.forEach(role => roles.add(role));
    }
    group.subgroups.forEach(subgroupId => {
      const subgroup = this.groups.get(subgroupId);
      if (subgroup) {
        this.getGroupRoles(subgroup, roles);
      }
    });
  }

  /**
   * Gets all roles inherited by a principal from the groups it belongs to.
   * @param principalId - The ID of the principal to get inherited roles for.
   * @param roles - A set to accumulate roles into.
   */
  private getMemberOfGroupsRoles(principalId: PrincipalId, roles: Set<Role>): void {
    this.groups.forEach(group => {
      if (group.members.has(principalId)) {
        this.getGroupRoles(group, roles);
      }
    });
  }

  /**
   * Retrieves a user by their principal ID.
   * @param principalId - The ID of the principal to retrieve.
   * @returns The User object if found and is a user, null otherwise.
   */
  getUser(principalId: PrincipalId): User | null {
    const principal = this.principals.get(principalId);
    return principal && principal.type === 'user' ? principal as User : null;
  }

  /**
   * Creates a new group.
   * @param groupId - The ID for the new group.
   * @param name - The name of the new group.
   */
  createGroup(groupId: GroupId, name: string): void {
    const group: Group = {
      id: groupId,
      type: 'group',
      name: name,
      members: new Set(),
      subgroups: new Set()
    };
    this.groups.set(groupId, group);
    this.principals.set(groupId, group);
    this.auditEmitter.emitGroupCreation(groupId, name);
  }

  /**
   * Adds a principal to a group.
   * @param groupId - The ID of the group to add the principal to.
   * @param principalId - The ID of the principal to add to the group.
   * @throws Error if the group or principal does not exist.
   */
  addToGroup(groupId: GroupId, principalId: PrincipalId): void {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group with id ${groupId} does not exist`);
    }
    if (!this.principals.has(principalId)) {
      throw new Error(`Principal with id ${principalId} does not exist`);
    }
    group.members.add(principalId);
    this.auditEmitter.emitGroupAddition(groupId, principalId);
  }

  /**
   * Adds a subgroup to a parent group.
   * @param parentGroupId - The ID of the parent group.
   * @param childGroupId - The ID of the child group to add.
   * @throws Error if either the parent or child group does not exist.
   */
  addSubgroup(parentGroupId: GroupId, childGroupId: GroupId): void {
    const parentGroup = this.groups.get(parentGroupId);
    const childGroup = this.groups.get(childGroupId);
    if (!parentGroup || !childGroup) {
      throw new Error('Both parent and child groups must exist');
    }
    parentGroup.subgroups.add(childGroupId);
  }

  removeFromGroup(groupId: GroupId, principalId: PrincipalId): void {
    const group = this.groups.get(groupId);
    if (group && group.members.delete(principalId)) {
      this.auditEmitter.emitGroupRemoval(groupId, principalId);
    }
  }

  /**
   * Explicitly denies a specific permission to a principal.
   * @param principalId - The ID of the principal to deny the permission to.
   * @param permission - The permission to deny.
   * @throws Error if the principal does not exist.
   */
  denyPermission(principalId: PrincipalId, permission: Permission): void {
    if (!this.principals.has(principalId)) {
      throw new Error(`Principal with id ${principalId} does not exist`);
    }
    if (!this.negativePermissions.has(principalId)) {
      this.negativePermissions.set(principalId, new Set());
    }
    this.negativePermissions.get(principalId)!.add(permission);
    this.auditEmitter.emitPermissionDenial(principalId, permission);
  }

  /**
   * Removes an explicit permission denial from a principal.
   * @param principalId - The ID of the principal to remove the denial from.
   * @param permission - The permission to remove the denial for.
   */
  removeDeniedPermission(principalId: PrincipalId, permission: Permission): void {
    const deniedPermissions = this.negativePermissions.get(principalId);
    if (deniedPermissions && deniedPermissions.delete(permission)) {
      this.auditEmitter.emitPermissionDenialRemoval(principalId, permission);
    }
  }

  /**
   * Adds a conditional checker for a specific principal and permission.
   * @param principalId - The ID of the principal.
   * @param permission - The permission to apply the condition to.
   * @param checker - The condition checker to add.
   */
  addConditionChecker(principalId: PrincipalId, permission: Permission, checker: ConditionChecker): void {
    if (!this.conditionCheckers.has(principalId)) {
      this.conditionCheckers.set(principalId, new Map());
    }
    const principalCheckers = this.conditionCheckers.get(principalId)!;
    if (!principalCheckers.has(permission)) {
      principalCheckers.set(permission, []);
    }
    principalCheckers.get(permission)!.push(checker);
    this.auditEmitter.emitConditionAddition(principalId, permission, checker.constructor.name);
  }

  /**
   * Gets all permissions for a role, including inherited permissions.
   * @param role - The role to get permissions for.
   * @returns A set of all permissions for the role.
   */
  private getRolePermissions(role: Role): Set<Permission> {
    const roleDefinition = this.roles.get(role);
    if (!roleDefinition) {
      return new Set();
    }

    const permissions = new Set(roleDefinition.permissions);

    if (roleDefinition.inherits) {
      for (const inheritedRole of roleDefinition.inherits) {
        const inheritedPermissions = this.getRolePermissions(inheritedRole);
        inheritedPermissions.forEach(permission => permissions.add(permission));
      }
    }

    return permissions;
  }

  /**
   * Checks if a principal has a specific permission, taking into account role hierarchy, negative permissions, and conditions.
   * @param principalId - The ID of the principal to check.
   * @param permission - The permission to check for.
   * @param context - Additional context for condition checking (e.g., IP address, current time).
   * @returns True if the principal has the permission and all conditions are met, false otherwise.
   */
  hasPermission(principalId: PrincipalId, permission: Permission, context?: any): boolean {
    let granted = false;
    let reason = '';

    // Check for negative permissions
    const deniedPermissions = this.negativePermissions.get(principalId);
    if (deniedPermissions && deniedPermissions.has(permission)) {
      reason = 'Explicitly denied';
      granted = false;
    } else {
      // Check if the permission is granted by any role, including inherited roles
      const principalRoles = this.getPrincipalRoles(principalId);
      for (const role of principalRoles) {
        const rolePermissions = this.getRolePermissions(role);
        if (rolePermissions.has(permission)) {
          granted = true;
          reason = `Granted by role: ${role}`;
          break;
        }
      }

      // Check conditions if the permission is granted
      if (granted) {
        const principalCheckers = this.conditionCheckers.get(principalId);
        if (principalCheckers) {
          const permissionCheckers = principalCheckers.get(permission);
          if (permissionCheckers) {
            for (const checker of permissionCheckers) {
              if (!checker.check(principalId, permission, context)) {
                granted = false;
                reason = `Denied by condition: ${checker.constructor.name}`;
                break;
              }
            }
          }
        }
      } else {
        reason = 'No matching role found';
      }
    }

    // Log the permission check if auditing is enabled
    if (this.logLevel !== 'none') {
      const logEntry: AuditLogEntry = {
        timestamp: new Date(),
        principalId,
        permission,
        granted,
        reason,
        ...(this.logLevel === 'detailed' ? { context } : {})
      };
      this.auditEmitter.emitPermissionCheck(logEntry);
    }

    return granted;
  }

  /**
   * Creates a new RBAC instance with default roles.
   * @returns A new RBAC instance initialized with default roles.
   */
  static setupDefaultRoles(): RBAC {
    const rbac = new RBAC();
    rbac.addRole('viewer', [DEFAULT.permissions.READ]);
    rbac.addRole('editor', [DEFAULT.permissions.WRITE], ['viewer']);
    rbac.addRole('manager', [DEFAULT.permissions.DELETE], ['editor']);
    rbac.addRole('admin', [DEFAULT.permissions.ADMIN], ['manager']);
    return rbac;
  }
}

export const DEFAULT = {
  permissions: {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    ADMIN: 'admin',
  },
  roles: new Map<Role, Permission[]>([
    ['viewer', ['read']],
    ['editor', ['read', 'write']],
    ['manager', ['read', 'write', 'delete']],
    ['admin', ['read', 'write', 'delete', 'admin']],
  ]),
};