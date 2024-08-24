// File: rbac-usage-example.ts

import { RBAC, Tenant, ResourceType, Resource, ResourceId, Permission, AdvancedIPChecker, TimeBasedChecker, User } from './rbac';

// Initialize RBAC with default roles
const rbac = RBAC.setupDefaultRoles();
rbac.setOptions({ logLevel: 'detailed' });

// Set up console logging for audit events
// rbac.auditEmitter.on('permissionCheck', (logEntry) => {
//   console.log('Permission Check:', JSON.stringify(logEntry, null, 2));
// });

// Add tenant
rbac.addTenant({ id: 'tenant1', name: 'Acme Corp' });

// Add resource types
rbac.addResourceType({
  id: 'counter',
  tenantId: 'tenant1',
  name: 'Counter',
  genericPermissions: new Set(['read', 'write']),
  specificPermissions: new Set(['increment', 'decrement'])
});

// Add resources
rbac.addResource({ id: 'counter1', tenantId: 'tenant1', namespaceId: 'default', typeId: 'counter' });
rbac.addResource({ id: 'counter2', tenantId: 'tenant1', namespaceId: 'default', typeId: 'counter' });

// Add users
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_doe' } as User);
rbac.addPrincipal({ id: 'user2', type: 'user', username: 'jane_smith' } as User);
rbac.addPrincipal({ id: 'user3', type: 'user', username: 'bob_johnson' } as User);
rbac.addPrincipal({ id: 'user4', type: 'user', username: 'alice_williams' } as User);
rbac.addPrincipal({ id: 'user5', type: 'user', username: 'jack_carpenter' } as User);

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

// Assign a direct role to a user
rbac.assignRole('user4', 'admin');

// Add resource-specific permissions
const counterResourceId: ResourceId = { tenantId: 'tenant1', namespaceId: 'default', resourceTypeId: 'counter', resourceId: 'counter1' };
const incrementPermission: Permission = { 
  action: 'increment',
  tenantId: 'tenant1',
  namespaceId: '*',
  resourceTypeId: 'counter',
  resourceId: 'counter1',
  effect: 'allow'
};

// viewers can increment
rbac.assignResourcePermission(counterResourceId, 'viewer', incrementPermission);

const decrementPermission: Permission = { 
  action: 'decrement',
  tenantId: 'tenant1',
  namespaceId: '*',
  resourceTypeId: 'counter',
  resourceId: 'counter1',
  effect: 'allow'
};
// editors can decrement
rbac.assignResourcePermission(counterResourceId, 'editor', decrementPermission);

// Function to check and log permissions
function checkPermission(principalId: string, action: string, resourceId: ResourceId, context: any, expected: boolean) {
  const permission: Permission = { 
    action, 
    tenantId: resourceId.tenantId,
    namespaceId: 'default',
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
checkPermission('user1', 'read', counterResourceId, null, true);
checkPermission('user2', 'read', counterResourceId, null, true);
checkPermission('user3', 'read', counterResourceId, null, true);
checkPermission('user4', 'read', counterResourceId, null, true);

// viewers should be able to increment
checkPermission('user1', 'increment', counterResourceId, null, true);
// but not decrement, write or delete
checkPermission('user1', 'decrement', counterResourceId, null, false);
checkPermission('user1', 'write', counterResourceId, null, false);
checkPermission('user1', 'delete', counterResourceId, null, false);

// editors, managers and admins should be able to write
checkPermission('user2', 'write', counterResourceId, null, true);
checkPermission('user4', 'write', counterResourceId, null, true);
// but managers should not
checkPermission('user3', 'write', counterResourceId, null, false);

// managers should be able to view and manage
checkPermission('user3', 'read', counterResourceId, null, true);
checkPermission('user3', 'manage', counterResourceId, null, true);
// but not delete or decrement
checkPermission('user3', 'delete', counterResourceId, null, false);
checkPermission('user3', 'decrement', counterResourceId, null, false);
checkPermission('user3', 'admin', counterResourceId, null, false);

// editors should be able to decrement
checkPermission('user2', 'decrement', counterResourceId, null, true);
// but should not be able to delete
checkPermission('user2', 'delete', counterResourceId, null, false);

console.log('\n--- Nested Group Permission Checks ---');
checkPermission('user2', 'manage', counterResourceId, null, true); // User2 is in group2 (Editors) which is nested in group3 (Managers)
// console.log(rbac.getPrincipalRoles('user2'))
// console.log(rbac.getGroupsMemberOf('user2'))

console.log('\n--- Admin Permission Checks ---');
// admins should be able to do anything
checkPermission('user4', 'decrement', counterResourceId, null, true);
checkPermission('user4', 'delete', counterResourceId, null, true);
checkPermission('user4', 'read', counterResourceId, null, true);
checkPermission('user4', 'write', counterResourceId, null, true);
checkPermission('user4', 'increment', counterResourceId, null, true);
checkPermission('user4', 'manage', counterResourceId, null, true);
checkPermission('user4', 'decrement', counterResourceId, null, true);
checkPermission('user4', 'admin', counterResourceId, null, true);

console.log('\n--- Conditional Permission Checks ---');
// Add conditional permissions
const businessHoursChecker = new TimeBasedChecker(9, 17);
const internalIPChecker = new AdvancedIPChecker([], ['192.168.1.0/24'], [], ['10.0.0.0/8']);

// baseline
checkPermission('user2', 'conditionalhoursedit', counterResourceId, null, false);
checkPermission('user2', 'conditionalipedit', counterResourceId, null, false);

const conditionalHoursEditPermission: Permission = {
  action: 'conditionalhoursedit',
  tenantId: 'tenant1',
  namespaceId: '*',
  resourceTypeId: 'counter',
  resourceId: 'counter1',
  effect: 'allow',
  conditions: [businessHoursChecker]
};

rbac.assignResourcePermission(
  counterResourceId,
  'editor',
  conditionalHoursEditPermission
);

const workHoursContext = { currentTime: new Date('2023-06-15T14:00:00'), ip: '192.168.1.100' };
const afterHoursContext = { currentTime: new Date('2023-06-15T20:00:00'), ip: '192.168.1.100' };
const externalIPContext = { currentTime: new Date('2023-06-15T14:00:00'), ip: '203.0.113.1' };
const internalIPContext = { currentTime: new Date('2023-06-15T14:00:00'), ip: '192.168.1.100' };
// ok
checkPermission('user2', 'conditionalhoursedit', counterResourceId, workHoursContext, true);
checkPermission('user2', 'conditionalhoursedit', counterResourceId, afterHoursContext, false);

const conditionalIPPermission: Permission = {
  action: 'conditionalipedit',
  tenantId: 'tenant1',
  namespaceId: '*',
  resourceTypeId: 'counter',
  resourceId: 'counter1',
  effect: 'allow',
  conditions: [internalIPChecker]
};

rbac.assignResourcePermission(
  counterResourceId,
  'editor',
  conditionalIPPermission
);

checkPermission('user2', 'conditionalipedit', counterResourceId, externalIPContext, false);
checkPermission('user2', 'conditionalipedit', counterResourceId, internalIPContext, true);

// console.log('\n--- Cross-Tenant Permission Checks ---');
// checkPermission('user3', 'view', { tenantId: 'tenant2', resourceTypeId: 'project', resourceId: 'proj1' });
// checkPermission('user4', 'close', { tenantId: 'tenant2', resourceTypeId: 'project', resourceId: 'proj1' });