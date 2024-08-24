// File: example-usage.ts

import { RBAC, Tenant, ResourceType, Resource, ResourceId, Permission, ConditionChecker } from './rbac';

// Create a new RBAC instance with default roles and auditing enabled
const rbac = RBAC.setupDefaultRoles();
rbac.setOptions({ logLevel: 'detailed' });

// Set up console logging for audit events
rbac.auditEmitter.on('permissionCheck', (logEntry) => {
  console.log('Permission Check:', JSON.stringify(logEntry, null, 2));
});

// Add a tenant
const tenant: Tenant = { id: 'tenant1', name: 'Acme Corp' };
rbac.addTenant(tenant);

// Add a resource type
const resourceType: ResourceType = {
  id: 'document',
  tenantId: 'tenant1',
  name: 'Document',
  genericPermissions: new Set(['read', 'write']),
  specificPermissions: new Set(['sign', 'archive'])
};
rbac.addResourceType(resourceType);

// Add a resource
const resource: Resource = { id: 'doc1', tenantId: 'tenant1', typeId: 'document' };
rbac.addResource(resource);

// Add users
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_doe' });
rbac.addPrincipal({ id: 'user2', type: 'user', username: 'jane_smith' });

// Assign roles
rbac.assignRole('user1', 'viewer');
rbac.assignRole('user2', 'editor');

// Assign resource-specific permission
const resourceId: ResourceId = { tenantId: 'tenant1', resourceTypeId: 'document', resourceId: 'doc1' };
const signPermission: Permission = { 
  action: 'sign', 
  tenantId: 'tenant1', 
  resourceTypeId: 'document', 
  resourceId: 'doc1', 
  effect: 'allow' 
};
rbac.assignResourcePermission(resourceId, 'editor', signPermission);

// Create a time-based condition checker
class BusinessHoursChecker implements ConditionChecker {
  check(principalId: string, permission: Permission, resourceId: ResourceId, context?: any): boolean {
    const now = context?.currentTime || new Date();
    const hours = now.getHours();
    return hours >= 9 && hours < 17;  // 9 AM to 5 PM
  }
}

// Add a conditional permission
const conditionalWritePermission: Permission = {
  action: 'write',
  tenantId: 'tenant1',
  resourceTypeId: 'document',
  resourceId: 'doc1',
  effect: 'allow',
  conditions: [new BusinessHoursChecker()]
};
rbac.assignResourcePermission(resourceId, 'editor', conditionalWritePermission);

// Function to check and log permissions
function checkPermission(principalId: string, action: string, context?: any) {
  const permission: Permission = { action, tenantId: 'tenant1', resourceTypeId: 'document', resourceId: 'doc1', effect: 'allow' };
  console.log(`\nChecking ${action} permission for ${principalId}:`);
  console