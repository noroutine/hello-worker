// File: example-usage.ts

import { RBAC, Principal, User, DEFAULT } from './rbac';

// Create a new RBAC instance with default roles and auditing enabled
const rbac = RBAC.setupDefaultRoles();
rbac.setOptions({ logLevel: 'detailed' });

// Set up console logging for all audit events
const eventTypes = [
  'permissionCheck', 'roleAssignment', 'roleRevocation', 'principalAddition',
  'principalRemoval', 'roleCreation', 'roleRemoval', 'groupCreation', 'groupAddition',
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

// Create a custom role
rbac.addRole('custom_role', [DEFAULT.permissions.READ, 'CUSTOM_PERMISSION']);

// Assign the custom role
rbac.assignRole('user1', 'custom_role');

// Check permissions
console.log('User1 has custom permission:', rbac.hasPermission('user1', 'CUSTOM_PERMISSION'));

// Remove the custom role
rbac.removeRole('custom_role');

// Check permissions again
console.log('User1 has custom permission after role removal:', rbac.hasPermission('user1', 'CUSTOM_PERMISSION'));

console.log('\nAudit events have been logged above.');