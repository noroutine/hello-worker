// File: example-usage.ts

import { RBAC, Principal, User, DEFAULT } from './rbac';

// Create a new RBAC instance with default roles
const rbac = RBAC.setupDefaultRoles();

// Add users
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_doe' } as User);
rbac.addPrincipal({ id: 'user2', type: 'user', username: 'jane_smith' } as User);

// Create groups
rbac.createGroup('group1', 'Editors');
rbac.createGroup('group2', 'Managers');

// Add users to groups
rbac.addToGroup('group1', 'user1');  // John is an Editor
rbac.addToGroup('group2', 'user2');  // Jane is a Manager

// Assign roles to groups
rbac.assignRole('group1', 'editor');
rbac.assignRole('group2', 'manager');

console.log('--- Basic Permission Checks ---');
console.log('User1 (Editor) can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE));  // true
console.log('User2 (Manager) can delete:', rbac.hasPermission('user2', DEFAULT.permissions.DELETE));  // true

// Deny specific permissions
rbac.denyPermission('user1', DEFAULT.permissions.WRITE);
rbac.denyPermission('user2', DEFAULT.permissions.DELETE);

console.log('\n--- After Denying Permissions ---');
console.log('User1 (Editor) can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE));  // false
console.log('User2 (Manager) can delete:', rbac.hasPermission('user2', DEFAULT.permissions.DELETE));  // false

// Remove denied permission
rbac.removeDeniedPermission('user1', DEFAULT.permissions.WRITE);

console.log('\n--- After Removing Denied Permission ---');
console.log('User1 (Editor) can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE));  // true
console.log('User2 (Manager) can delete:', rbac.hasPermission('user2', DEFAULT.permissions.DELETE));  // false

// Check that other permissions are unaffected
console.log('\n--- Other Permissions Check ---');
console.log('User1 (Editor) can read:', rbac.hasPermission('user1', DEFAULT.permissions.READ));  // true
console.log('User2 (Manager) can write:', rbac.hasPermission('user2', DEFAULT.permissions.WRITE));  // true