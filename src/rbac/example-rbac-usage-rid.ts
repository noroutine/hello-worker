// File: rbac-usage-example.ts

import { RBAC, Tenant, ResourceType, Resource, ResourceId, Permission, AdvancedIPChecker, TimeBasedChecker, User } from './rbac';

// Initialize RBAC with default roles
const rbac = RBAC.setupDefaultRoles();
rbac.setOptions({ logLevel: 'detailed' });

// Set up console logging for audit events
rbac.auditEmitter.on('permissionCheck', (logEntry) => {
  console.log('Permission Check:', JSON.stringify(logEntry, null, 2));
});

// Add tenants
rbac.addTenant({ id: 'tenant1', name: 'Acme Corp' });
rbac.addTenant({ id: 'tenant2', name: 'Globex Inc' });

// Add resource types
rbac.addResourceType({
  id: 'document',
  tenantId: 'tenant1',
  name: 'Document',
  genericPermissions: new Set(['read', 'write']),
  specificPermissions: new Set(['sign', 'archive'])
});

rbac.addResourceType({
  id: 'project',
  tenantId: 'tenant2',
  name: 'Project',
  genericPermissions: new Set(['view', 'edit']),
  specificPermissions: new Set(['close', 'reopen'])
});

// Add resources
rbac.addResource({ id: 'doc1', tenantId: 'tenant1', typeId: 'document' });
rbac.addResource({ id: 'doc2', tenantId: 'tenant1', typeId: 'document' });
rbac.addResource({ id: 'proj1', tenantId: 'tenant2', typeId: 'project' });

// Add users
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_doe' } as User);
rbac.addPrincipal({ id: 'user2', type: 'user', username: 'jane_smith' } as User);
rbac.addPrincipal({ id: 'user3', type: 'user', username: 'bob_johnson' } as User);
rbac.addPrincipal({ id: 'user4', type: 'user', username: 'alice_williams' } as User);

// Create nested groups
rbac.createGroup('group1', 'Viewers');
rbac.createGroup('group2', 'Editors');
rbac.createGroup('group3', 'Managers');

rbac.addToGroup('group1', 'user1');
rbac.addToGroup('group2', 'user2');
rbac.addToGroup('group3', 'user3');
rbac.addToGroup('group3', 'group2'); // Nested group: Managers include Editors

// Assign roles to groups
rbac.assignRole('group1', 'viewer');
rbac.assignRole('group2', 'editor');
rbac.assignRole('group3', 'manager');

// managers are also owner, can delete
rbac.assignRole('group3', 'owner')

// Assign a direct role to a user
rbac.assignRole('user4', 'admin');


// Add resource-specific permissions
const docResourceId: ResourceId = { tenantId: 'tenant1', resourceTypeId: 'document', resourceId: 'doc1' };
const doc2ResourceId: ResourceId = { tenantId: 'tenant1', resourceTypeId: 'document', resourceId: 'doc2' };
const signPermission: Permission = { 
  action: 'sign', 
  tenantId: 'tenant1', 
  resourceTypeId: 'document', 
  resourceId: '*', 
  effect: 'allow' 
};
rbac.assignResourcePermission(docResourceId, 'editor', signPermission);

// Add conditional permissions
const businessHoursChecker = new TimeBasedChecker(9, 17);
const internalIPChecker = new AdvancedIPChecker([], ['192.168.1.0/24'], [], ['10.0.0.0/8']);

const conditionalEditPermission: Permission = {
  action: 'edit',
  tenantId: 'tenant2',
  resourceTypeId: 'project',
  resourceId: 'proj1',
  effect: 'allow',
  conditions: [businessHoursChecker, internalIPChecker]
};

rbac.assignResourcePermission(
  { tenantId: 'tenant2', resourceTypeId: 'project', resourceId: 'proj1' },
  'editor',
  conditionalEditPermission
);

// Function to check and log permissions
function checkPermission(principalId: string, action: string, resourceId: ResourceId, context: any, expected: boolean) {
  const permission: Permission = { 
    action, 
    tenantId: resourceId.tenantId, 
    resourceTypeId: resourceId.resourceTypeId, 
    resourceId: resourceId.resourceId, 
    effect: 'allow' 
  };
  console.log(`\nChecking ${action} permission for ${principalId} on ${resourceId.resourceId}:`);
  let result = rbac.hasPermission(principalId, permission, resourceId, context)
  console.log('Result   :', result);
  console.log('Expected :', expected);
  if (String(result) == String(expected)) {
    console.log('✅ Pass')
  } else {
    console.log('🤬 Fail')
  }
}

// console.log(rbac)
// console.log(rbac.getAllRoles("user1"))
// console.log(rbac.getPrincipalRoles("user1"))
// Test scenarios
console.log('--- Basic Permission Checks ---');
checkPermission('user1', 'read', docResourceId, null, true);
checkPermission('user2', 'write', docResourceId, null, true);
checkPermission('user2', 'sign', docResourceId, null, true);
checkPermission('user3', 'delete', docResourceId, null, true);

console.log('\n--- Nested Group Permission Checks ---');
checkPermission('user2', 'delete', docResourceId, null, true); // User2 is in group2 (Editors) which is nested in group3 (Managers)

console.log('\n--- Admin Permission Checks ---');
checkPermission('user4', 'admin', { tenantId: 'tenant2', resourceTypeId: 'project', resourceId: 'proj1' }, null, true);

console.log('\n--- Conditional Permission Checks ---');
const workHoursContext = { currentTime: new Date('2023-06-15T14:00:00'), ip: '192.168.1.100' };
const afterHoursContext = { currentTime: new Date('2023-06-15T20:00:00'), ip: '192.168.1.100' };
const externalIPContext = { currentTime: new Date('2023-06-15T14:00:00'), ip: '203.0.113.1' };

checkPermission('user2', 'edit', { tenantId: 'tenant2', resourceTypeId: 'project', resourceId: 'proj1' }, workHoursContext, true);
checkPermission('user2', 'edit', { tenantId: 'tenant2', resourceTypeId: 'project', resourceId: 'proj1' }, afterHoursContext, false);
checkPermission('user2', 'edit', { tenantId: 'tenant2', resourceTypeId: 'project', resourceId: 'proj1' }, externalIPContext, false);

console.log('\n--- Cross-Tenant Permission Checks ---');
checkPermission('user3', 'view', { tenantId: 'tenant2', resourceTypeId: 'project', resourceId: 'proj1' }, null, false);
// admin can do
checkPermission('user4', 'close', { tenantId: 'tenant2', resourceTypeId: 'project', resourceId: 'proj1' }, null, true);