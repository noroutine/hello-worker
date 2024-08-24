// File: example-usage.ts

import { RBAC, Principal, User, DEFAULT, TimeBasedChecker } from './rbac';

// Create a new RBAC instance with default roles and auditing enabled
const rbac = RBAC.setupDefaultRoles();
rbac.setOptions({ logLevel: 'detailed' });

// Set up console logging for all audit events
const eventTypes = [
  'permissionCheck', 'roleAssignment', 'roleRevocation', 'principalAddition',
  'principalRemoval', 'roleCreation', 'groupCreation', 'groupAddition',
  'groupRemoval', 'permissionDenial', 'permissionDenialRemoval', 'conditionAddition'
];

eventTypes.forEach(eventType => {
  rbac.auditEmitter.on(eventType, (event) => {
    console.log(`${eventType}:`, JSON.stringify(event, null, 2));
  });
});

// Add users
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_viewer' } as User);
rbac.addPrincipal({ id: 'user2', type: 'user', username: 'jane_editor' } as User);

// Assign roles
rbac.assignRole('user1', 'viewer');
rbac.assignRole('user2', 'editor');

// Create a group and add users
rbac.createGroup('group1', 'TeamA');
rbac.addToGroup('group1', 'user1');
rbac.addToGroup('group1', 'user2');

// Remove a user from the group
rbac.removeFromGroup('group1', 'user1');

// Deny a permission
rbac.denyPermission('user1', DEFAULT.permissions.WRITE);

// Remove a denied permission
rbac.removeDeniedPermission('user1', DEFAULT.permissions.WRITE);

// Add a condition checker
const businessHoursChecker = new TimeBasedChecker(9, 17);
rbac.addConditionChecker('user2', DEFAULT.permissions.WRITE, businessHoursChecker);

// Check permissions
rbac.hasPermission('user1', DEFAULT.permissions.READ);
rbac.hasPermission('user2', DEFAULT.permissions.WRITE);

// Remove a principal
rbac.removePrincipal('user1');

// Create a custom role
rbac.addRole('custom_role', [DEFAULT.permissions.READ, 'CUSTOM_PERMISSION']);

console.log('\nAudit events have been logged above.');