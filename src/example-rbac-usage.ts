// File: example-usage.ts

import { RBAC, Principal, User, DEFAULT } from './rbac';

// Create a new RBAC instance with default roles
const rbac = RBAC.setupDefaultRoles();

// Add users
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_doe' } as User);
rbac.addPrincipal({ id: 'user2', type: 'user', username: 'jane_smith' } as User);
rbac.addPrincipal({ id: 'user3', type: 'user', username: 'bob_johnson' } as User);
rbac.addPrincipal({ id: 'user4', type: 'user', username: 'alice_williams' } as User);
rbac.addPrincipal({ id: 'user5', type: 'user', username: 'charlie_brown' } as User);

// Create groups with 3-level nesting
rbac.createGroup('group1', 'Viewers');
rbac.createGroup('group2', 'Editors');
rbac.createGroup('group3', 'Managers');
rbac.createGroup('group4', 'Senior Managers');
rbac.createGroup('group5', 'Executives');

// Create nested group structure
rbac.addSubgroup('group2', 'group1');  // Editors include Viewers
rbac.addSubgroup('group3', 'group2');  // Managers include Editors (and by extension, Viewers)
rbac.addSubgroup('group4', 'group3');  // Senior Managers include Managers
rbac.addSubgroup('group5', 'group4');  // Executives include Senior Managers

// Add users to groups
rbac.addToGroup('group1', 'user1');  // John is a Viewer
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
console.log('User1 (Viewer) can read:', rbac.hasPermission('user1', DEFAULT.permissions.READ));  // true
console.log('User1 (Viewer) can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE));  // false
console.log('User2 (Editor) can write:', rbac.hasPermission('user2', DEFAULT.permissions.WRITE));  // true
console.log('User2 (Editor) can delete:', rbac.hasPermission('user2', DEFAULT.permissions.DELETE));  // false

console.log('\n--- Nested Group Permission Checks ---');
console.log('User3 (Manager) can delete:', rbac.hasPermission('user3', DEFAULT.permissions.DELETE));  // true
console.log('User4 (Senior Manager) can delete:', rbac.hasPermission('user4', DEFAULT.permissions.DELETE));  // true
console.log('User5 (Executive) has admin permission:', rbac.hasPermission('user5', DEFAULT.permissions.ADMIN));  // true

console.log('\n--- Inherited Permission Checks ---');
console.log('User3 (Manager) can read:', rbac.hasPermission('user3', DEFAULT.permissions.READ));  // true (inherited from Viewer)
console.log('User4 (Senior Manager) can write:', rbac.hasPermission('user4', DEFAULT.permissions.WRITE));  // true (inherited from Editor)
console.log('User5 (Executive) can delete:', rbac.hasPermission('user5', DEFAULT.permissions.DELETE));  // true (inherited from Manager)

// Add a user to multiple groups
rbac.addToGroup('group1', 'user2');  // Jane is now also a Viewer

console.log('\n--- Multiple Group Membership Checks ---');
console.log('User2 (Editor + Viewer) can read:', rbac.hasPermission('user2', DEFAULT.permissions.READ));  // true
console.log('User2 (Editor + Viewer) can write:', rbac.hasPermission('user2', DEFAULT.permissions.WRITE));  // true (from Editor role)

// Direct role assignment
rbac.assignRole('user1', 'editor');

console.log('\n--- Direct Role Assignment Checks ---');
console.log('User1 (Viewer + direct Editor role) can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE));  // true

// Demonstrating the distinction between Senior Managers and Executives
console.log('\n--- Senior Management vs Executive Checks ---');
console.log('User4 (Senior Manager) has admin permission:', rbac.hasPermission('user4', DEFAULT.permissions.ADMIN));  // false
console.log('User5 (Executive) has admin permission:', rbac.hasPermission('user5', DEFAULT.permissions.ADMIN));  // true

// Testing a user with no roles
rbac.addPrincipal({ id: 'user6', type: 'user', username: 'eve_nobody' } as User);

console.log('\n--- User with No Roles Checks ---');
console.log('User6 (No roles) can read:', rbac.hasPermission('user6', DEFAULT.permissions.READ));  // false
console.log('User6 (No roles) can write:', rbac.hasPermission('user6', DEFAULT.permissions.WRITE));  // false
console.log('User6 (No roles) can delete:', rbac.hasPermission('user6', DEFAULT.permissions.DELETE));  // false
console.log('User6 (No roles) has admin permission:', rbac.hasPermission('user6', DEFAULT.permissions.ADMIN));  // false