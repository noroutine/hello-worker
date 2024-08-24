// File: example-usage.ts

import { RBAC, Principal, Permission, User, ResourceId, DEFAULT } from './rbac';

// Create a new RBAC instance with default roles
const rbac = RBAC.setupDefaultRoles();
rbac.setOptions({ logLevel: 'detailed' });

// Set up console logging for audit events
rbac.auditEmitter.on('permissionCheck', (logEntry) => {
  console.log('Permission Check:', JSON.stringify(logEntry, null, 2));
});

rbac.addTenant({ id: 'tenant1', name: 'Acme Corp' });
// Add resource types
rbac.addResourceType({
  id: 'document',
  tenantId: 'tenant1',
  name: 'Document',
  genericPermissions: new Set(['read', 'write']),
  specificPermissions: new Set(['sign', 'archive'])
});
// Add resources
rbac.addResource({ id: 'doc1', tenantId: 'tenant1', typeId: 'document' });

const docResourceId: ResourceId = { tenantId: 'tenant1', resourceTypeId: 'document', resourceId: 'doc1' };

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

// Add users
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_doe' } as User);
rbac.addPrincipal({ id: 'user2', type: 'user', username: 'jane_smith' } as User);
rbac.addPrincipal({ id: 'user3', type: 'user', username: 'bob_johnson' } as User);
rbac.addPrincipal({ id: 'user4', type: 'user', username: 'alice_williams' } as User);
rbac.addPrincipal({ id: 'user5', type: 'user', username: 'charlie_brown' } as User);

// Create groups with 3-level nesting
rbac.createGroup('group1_swe', 'Software Engineers');
rbac.createGroup('group2_qa', 'Quality Assurance');
rbac.createGroup('group2_eng', 'Engineering');
rbac.createGroup('group3_managers', 'Managers');
rbac.createGroup('group4_senior_managers', 'Senior Managers');
rbac.createGroup('group5_mgmt', 'Management');
rbac.createGroup('group6_execs', 'Executives');
rbac.createGroup('group7_decision_makers', 'Decision Makers');

// Create nested group structure
rbac.addSubgroup('group2_eng', 'group1_swe');  // Engineering include SWEs
rbac.addSubgroup('group2_eng', 'group2_qa');  // Engineering include QA
rbac.addSubgroup('group2_eng', 'group3_managers');  // Engineering include Managers
rbac.addSubgroup('group5_mgmt', 'group4_senior_managers');  // Management include senior managers
rbac.addSubgroup('group5_mgmt', 'group3_managers');  // Management includes managers
rbac.addSubgroup('group7_decision_makers', 'group4_senior_managers');  // Privileged include Senior Managers
rbac.addSubgroup('group7_decision_makers', 'group6_execs');  // Privileged include Senior Managers

// Add users to groups
rbac.addToGroup('group1_swe', 'user1');  // John is a SWE
rbac.addToGroup('group2_qa', 'user2');  // John is a QA
rbac.addToGroup('group2', 'user2');  // Jane is an Editor
rbac.addToGroup('group3', 'user3');  // Bob is a Manager
rbac.addToGroup('group4', 'user4');  // Alice is a Senior Manager
rbac.addToGroup('group5', 'user5');  // Charlie is an Executive

// Assign roles to groups
rbac.assignRole('group1', 'viewer');
rbac.assignRole('group2', 'editor');
rbac.assignRole('group3', 'manager');
rbac.assignRole('group4', 'manager');  // Senior Managers have the same role as Managers
rbac.assignRole('group5', 'admin');

console.log('--- Basic Permission Checks ---');
checkPermission('user1', DEFAULT.permissions.READ, docResourceId, null, true);  // User1 (Viewer) can read,   true
checkPermission('user1', DEFAULT.permissions.WRITE, docResourceId, null, false);  // User1 (Viewer) can write,   false
// console.log(rbac.getAllRoles("user1"))
console.log(rbac.getPrincipalRoles("user1"))

// checkPermission('user2', DEFAULT.permissions.WRITE, docResourceId, null, true);  // User2 (Editor) can write,   true
// checkPermission('user2', DEFAULT.permissions.DELETE, docResourceId, null, false);  // User2 (Editor) can delete,   false
// console.log('User1 (Viewer) can read:', rbac.hasPermission('user1', DEFAULT.permissions.READ, docResourceId));
// console.log('User1 (Viewer) can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE, docResourceId));  // false
// console.log('User2 (Editor) can write:', rbac.hasPermission('user2', DEFAULT.permissions.WRITE, docResourceId));  // true
// console.log('User2 (Editor) can delete:', rbac.hasPermission('user2', DEFAULT.permissions.DELETE, docResourceId));  // false

// console.log('\n--- Nested Group Permission Checks ---');
// console.log('User3 (Manager) can delete:', rbac.hasPermission('user3', DEFAULT.permissions.DELETE));  // true
// console.log('User4 (Senior Manager) can delete:', rbac.hasPermission('user4', DEFAULT.permissions.DELETE));  // true
// console.log('User5 (Executive) has admin permission:', rbac.hasPermission('user5', DEFAULT.permissions.ADMIN));  // true

// console.log('\n--- Inherited Permission Checks ---');
// console.log('User3 (Manager) can read:', rbac.hasPermission('user3', DEFAULT.permissions.READ));  // true (inherited from Viewer)
// console.log('User4 (Senior Manager) can write:', rbac.hasPermission('user4', DEFAULT.permissions.WRITE));  // true (inherited from Editor)
// console.log('User5 (Executive) can delete:', rbac.hasPermission('user5', DEFAULT.permissions.DELETE));  // true (inherited from Manager)

// // Add a user to multiple groups
// rbac.addToGroup('group1', 'user2');  // Jane is now also a Viewer

// console.log('\n--- Multiple Group Membership Checks ---');
// console.log('User2 (Editor + Viewer) can read:', rbac.hasPermission('user2', DEFAULT.permissions.READ));  // true
// console.log('User2 (Editor + Viewer) can write:', rbac.hasPermission('user2', DEFAULT.permissions.WRITE));  // true (from Editor role)

// // Direct role assignment
// rbac.assignRole('user1', 'editor');

// console.log('\n--- Direct Role Assignment Checks ---');
// console.log('User1 (Viewer + direct Editor role) can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE));  // true

// // Demonstrating the distinction between Senior Managers and Executives
// console.log('\n--- Senior Management vs Executive Checks ---');
// console.log('User4 (Senior Manager) has admin permission:', rbac.hasPermission('user4', DEFAULT.permissions.ADMIN));  // false
// console.log('User5 (Executive) has admin permission:', rbac.hasPermission('user5', DEFAULT.permissions.ADMIN));  // true

// // Testing a user with no roles
// rbac.addPrincipal({ id: 'user6', type: 'user', username: 'eve_nobody' } as User);

// console.log('\n--- User with No Roles Checks ---');
// console.log('User6 (No roles) can read:', rbac.hasPermission('user6', DEFAULT.permissions.READ));  // false
// console.log('User6 (No roles) can write:', rbac.hasPermission('user6', DEFAULT.permissions.WRITE));  // false
// console.log('User6 (No roles) can delete:', rbac.hasPermission('user6', DEFAULT.permissions.DELETE));  // false
// console.log('User6 (No roles) has admin permission:', rbac.hasPermission('user6', DEFAULT.permissions.ADMIN));  // false