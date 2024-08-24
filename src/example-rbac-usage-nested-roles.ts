// File: example-usage.ts

import { RBAC, Principal, User, DEFAULT, ConsoleAuditLogger } from './rbac';

// Create a new RBAC instance with default roles and auditing enabled
const rbac = RBAC.setupDefaultRoles();
const auditLogger = new ConsoleAuditLogger();
rbac.setOptions({ auditLogger, logLevel: 'basic' });

// Add users
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_viewer' } as User);
rbac.addPrincipal({ id: 'user2', type: 'user', username: 'jane_editor' } as User);
rbac.addPrincipal({ id: 'user3', type: 'user', username: 'bob_manager' } as User);
rbac.addPrincipal({ id: 'user4', type: 'user', username: 'alice_admin' } as User);

// Assign roles
rbac.assignRole('user1', 'viewer');
rbac.assignRole('user2', 'editor');
rbac.assignRole('user3', 'manager');
rbac.assignRole('user4', 'admin');

// Function to check and log permissions for a user
function checkUserPermissions(userId: string, username: string) {
  console.log(`\n--- Checking permissions for ${username} ---`);
  console.log('Can read:', rbac.hasPermission(userId, DEFAULT.permissions.READ));
  console.log('Can write:', rbac.hasPermission(userId, DEFAULT.permissions.WRITE));
  console.log('Can delete:', rbac.hasPermission(userId, DEFAULT.permissions.DELETE));
  console.log('Has admin access:', rbac.hasPermission(userId, DEFAULT.permissions.ADMIN));
}

// Check permissions for all users
checkUserPermissions('user1', 'John (Viewer)');
checkUserPermissions('user2', 'Jane (Editor)');
checkUserPermissions('user3', 'Bob (Manager)');
checkUserPermissions('user4', 'Alice (Admin)');

// Demonstrate negative permissions
rbac.denyPermission('user3', DEFAULT.permissions.DELETE);
console.log('\n--- After denying DELETE permission to Bob (Manager) ---');
checkUserPermissions('user3', 'Bob (Manager)');

// Add a custom role
rbac.addRole('super_admin', [DEFAULT.permissions.ADMIN, 'SUPER_POWER'], ['admin']);
rbac.assignRole('user4', 'super_admin');

console.log('\n--- After adding super_admin role to Alice ---');
checkUserPermissions('user4', 'Alice (Super Admin)');
console.log('Has super power:', rbac.hasPermission('user4', 'SUPER_POWER'));