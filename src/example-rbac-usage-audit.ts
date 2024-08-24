// File: example-usage.ts

import { RBAC, Principal, User, DEFAULT, TimeBasedChecker, ConsoleAuditLogger } from './rbac';

// Create a new RBAC instance with default roles
const rbac = RBAC.setupDefaultRoles();

// Set up auditing
const auditLogger = new ConsoleAuditLogger();
rbac.setOptions({ auditLogger, logLevel: 'detailed' });

// Add a user
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_doe' } as User);

// Create a group and add the user to it
rbac.createGroup('group1', 'DaytimeEditors');
rbac.addToGroup('group1', 'user1');

// Assign the editor role to the group
rbac.assignRole('group1', 'editor');

// Create a time-based checker for business hours (9 AM to 5 PM)
const businessHoursChecker = new TimeBasedChecker(9, 17);

// Add the time-based condition to the write permission for user1
rbac.addConditionChecker('user1', DEFAULT.permissions.WRITE, businessHoursChecker);

// Function to check and log permissions
function checkAndLogPermission(hour: number) {
  const currentTime = new Date();
  currentTime.setHours(hour, 0, 0, 0);

  console.log(`\n--- Checking permissions at ${hour}:00 ---`);
  rbac.hasPermission('user1', DEFAULT.permissions.READ, { currentTime });
  rbac.hasPermission('user1', DEFAULT.permissions.WRITE, { currentTime });
  rbac.hasPermission('user1', DEFAULT.permissions.DELETE, { currentTime });
}

// Check permissions at different times
checkAndLogPermission(8);   // Before business hours
checkAndLogPermission(12);  // During business hours
checkAndLogPermission(18);  // After business hours

// Add a negative permission
rbac.denyPermission('user1', DEFAULT.permissions.DELETE);
checkAndLogPermission(12);  // Check again with negative permission

// Demonstrate changing log level
console.log('\n--- Changing log level to basic ---');
rbac.setOptions({ logLevel: 'basic' });
checkAndLogPermission(12);  // This will log without the context