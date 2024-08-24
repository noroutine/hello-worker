// File: rbac-usage-example.ts

import { buildRbac } from './counters_rbac';
import { RBAC, Tenant, ResourceType, Resource, ResourceId, Permission, AdvancedIPChecker, TimeBasedChecker, User } from './rbac';

// Initialize RBAC with default roles
const rbac = buildRbac()

// // Set up console logging for audit events
// rbac.auditEmitter.on('permissionCheck', (logEntry) => {
//   console.log('Permission Check:', JSON.stringify(logEntry, null, 2));
// });

// John is an autenticated user, he can manage everything in his own namespace in tenant noroutine, and can also view/increment in other namespaces
// viewers can increment
// add incrementor role
rbac.addPrincipal({ id: 'john_doe', type: 'user', username: 'John Doe' } as User);
rbac.addRole('john_doe_owner', [ { action: '*', tenantId: 'tenant1', namespaceId: 'john_doe', resourceTypeId: '*', resourceId: '*', effect: 'allow' } ], [ 'incrementor' ]);
rbac.assignRole('john_doe', 'john_doe_owner');


// Add resource-specific permissions
const counterResourceId1: ResourceId =  { tenantId: 'tenant1', namespaceId: 'default', resourceTypeId: 'counter', resourceId: 'counter1' };
const counterResourceId2: ResourceId =  { tenantId: 'tenant1', namespaceId: 'default', resourceTypeId: 'counter', resourceId: 'counter2' };
const counterSessionedId1: ResourceId = { tenantId: 'tenant1', namespaceId: 'john_doe', resourceTypeId: 'counter', resourceId: 'counter3' };
const counterSessionedId2: ResourceId = { tenantId: 'tenant1', namespaceId: 'john_doe', resourceTypeId: 'counter', resourceId: 'counter4' };
const counterSessionedId3: ResourceId = { tenantId: 'tenant1', namespaceId: 'jill_smith', resourceTypeId: 'counter', resourceId: 'counter5' };
const counterSessionedId4: ResourceId = { tenantId: 'tenant1', namespaceId: 'jake_williams', resourceTypeId: 'counter', resourceId: 'counter6' };

const transientCounterId1: ResourceId = { tenantId: 'tenant1', namespaceId: 'transient', resourceTypeId: 'counter', resourceId: 'counter1' };
const transientCounterId2: ResourceId = { tenantId: 'tenant1', namespaceId: 'transient', resourceTypeId: 'counter', resourceId: 'counter2' };

// Function to check and log permissions
function checkPermission(principalId: string, action: string, resourceId: ResourceId, context: any, expected: boolean) {
  const permission: Permission = { 
    action, 
    tenantId: resourceId.tenantId, 
    namespaceId: resourceId.namespaceId,
    resourceTypeId: resourceId.resourceTypeId, 
    resourceId: resourceId.resourceId, 
    effect: 'allow' 
  };
  console.log(`\nChecking ${action} permission for ${principalId} on ${resourceId.resourceId}:`);
  let result = rbac.hasPermission(principalId, permission, resourceId, context)
  // console.log('Result   :', result);
  // console.log('Expected :', expected);
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
console.log('--- Anonymous Permission Checks ---');
checkPermission('anonymous', 'read', counterResourceId1, null, true);
checkPermission('anonymous', 'read', counterResourceId2, null, true);
checkPermission('anonymous', 'write', counterResourceId1, null, false);
checkPermission('anonymous', 'write', counterResourceId2, null, false);
checkPermission('anonymous', 'increment', counterResourceId1, null, true);
checkPermission('anonymous', 'increment', counterResourceId2, null, true);
checkPermission('anonymous', 'decrement', counterResourceId1, null, false);
checkPermission('anonymous', 'decrement', counterResourceId2, null, false);
checkPermission('anonymous', 'delete', counterResourceId1, null, false);
checkPermission('anonymous', 'delete', counterResourceId2, null, false);
checkPermission('anonymous', 'update', counterResourceId1, null, false);
checkPermission('anonymous', 'update', counterResourceId2, null, false);
checkPermission('anonymous', 'admin', counterResourceId1, null, false);
checkPermission('anonymous', 'admin', counterResourceId2, null, false);

console.log('--- God Mode Permission Checks ---');
checkPermission('god', 'read', counterResourceId1, null, true);
checkPermission('god', 'read', counterResourceId2, null, true);
checkPermission('god', 'write', counterResourceId1, null, true);
checkPermission('god', 'write', counterResourceId2, null, true);
checkPermission('god', 'increment', counterResourceId1, null, true);
checkPermission('god', 'increment', counterResourceId2, null, true);
checkPermission('god', 'decrement', counterResourceId1, null, true);
checkPermission('god', 'decrement', counterResourceId2, null, true);
checkPermission('god', 'delete', counterResourceId1, null, true);
checkPermission('god', 'delete', counterResourceId2, null, true);
checkPermission('god', 'update', counterResourceId1, null, true);
checkPermission('god', 'update', counterResourceId2, null, true);
checkPermission('god', 'admin', counterResourceId1, null, true);
checkPermission('god', 'admin', counterResourceId2, null, true);

console.log('--- Own Namespace Permission Checks ---');
checkPermission('john_doe', 'read', counterSessionedId1, null, true);
checkPermission('john_doe', 'write', counterSessionedId1, null, true);
checkPermission('john_doe', 'increment', counterSessionedId1, null, true);
checkPermission('john_doe', 'decrement', counterSessionedId1, null, true);
checkPermission('john_doe', 'delete', counterSessionedId1, null, true);
checkPermission('john_doe', 'update', counterSessionedId1, null, true);
checkPermission('john_doe', 'admin', counterSessionedId1, null, true);

console.log('--- Other Namespace Permission Checks ---');
checkPermission('john_doe', 'read', counterSessionedId3, null, true);
checkPermission('john_doe', 'write', counterSessionedId3, null, false);
checkPermission('john_doe', 'increment', counterSessionedId3, null, true);
checkPermission('john_doe', 'decrement', counterSessionedId3, null, false);
checkPermission('john_doe', 'delete', counterSessionedId3, null, false);
checkPermission('john_doe', 'update', counterSessionedId3, null, false);
checkPermission('john_doe', 'admin', counterSessionedId3, null, false);

console.log(rbac.getPrincipalRoles("john_doe"))

console.log('--- Transient Namespace Permission Checks ---');
checkPermission('anonymous', 'read', transientCounterId2, null, true);
checkPermission('anonymous', 'read', counterResourceId2, null, true);
checkPermission('anonymous', 'write', transientCounterId2, null, true);
checkPermission('anonymous', 'write', counterResourceId2, null, false);
checkPermission('anonymous', 'increment', transientCounterId2, null, true);
checkPermission('anonymous', 'increment', counterResourceId2, null, true);
checkPermission('anonymous', 'decrement', transientCounterId2, null, true);
checkPermission('anonymous', 'decrement', counterResourceId2, null, false);
checkPermission('anonymous', 'delete', transientCounterId2, null, true);
checkPermission('anonymous', 'delete', counterResourceId2, null, false);
checkPermission('anonymous', 'update', transientCounterId2, null, true);
checkPermission('anonymous', 'update', counterResourceId2, null, false);
checkPermission('anonymous', 'admin', transientCounterId2, null, true);
checkPermission('anonymous', 'admin', counterResourceId2, null, false);


// checkPermission('user2', 'read', counterResourceId, null, true);
// checkPermission('user3', 'read', counterResourceId, null, true);
// checkPermission('user4', 'read', counterResourceId, null, true);

// // viewers should be able to increment
// checkPermission('user1', 'increment', counterResourceId, null, true);
// // but not decrement, write or delete
// checkPermission('user1', 'decrement', counterResourceId, null, false);
// checkPermission('user1', 'write', counterResourceId, null, false);
// checkPermission('user1', 'delete', counterResourceId, null, false);

// // editors, managers and admins should be able to write
// checkPermission('user2', 'write', counterResourceId, null, true);
// checkPermission('user4', 'write', counterResourceId, null, true);
// // but managers should not
// checkPermission('user3', 'write', counterResourceId, null, false);

// // managers should be able to view and manage
// checkPermission('user3', 'read', counterResourceId, null, true);
// checkPermission('user3', 'manage', counterResourceId, null, true);
// // but not delete or decrement
// checkPermission('user3', 'delete', counterResourceId, null, false);
// checkPermission('user3', 'decrement', counterResourceId, null, false);
// checkPermission('user3', 'admin', counterResourceId, null, false);

// // editors should be able to decrement
// checkPermission('user2', 'decrement', counterResourceId, null, true);
// // but should not be able to delete
// checkPermission('user2', 'delete', counterResourceId, null, false);

// console.log('\n--- Nested Group Permission Checks ---');
// checkPermission('user2', 'manage', counterResourceId, null, true); // User2 is in group2 (Editors) which is nested in group3 (Managers)
// // console.log(rbac.getPrincipalRoles('user2'))
// // console.log(rbac.getGroupsMemberOf('user2'))

// console.log('\n--- Admin Permission Checks ---');
// // admins should be able to do anything
// checkPermission('user4', 'decrement', counterResourceId, null, true);
// checkPermission('user4', 'delete', counterResourceId, null, true);
// checkPermission('user4', 'read', counterResourceId, null, true);
// checkPermission('user4', 'write', counterResourceId, null, true);
// checkPermission('user4', 'increment', counterResourceId, null, true);
// checkPermission('user4', 'manage', counterResourceId, null, true);
// checkPermission('user4', 'decrement', counterResourceId, null, true);
// checkPermission('user4', 'admin', counterResourceId, null, true);
