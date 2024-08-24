// File: example-usage.ts

import { RBAC, Principal, User, DEFAULT, TimeBasedChecker } from './rbac';

// Create a new RBAC instance with default roles
const rbac = RBAC.setupDefaultRoles();

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

// Create a time-based checker for night shift (8 PM to 4 AM)
const nightShiftChecker = new TimeBasedChecker(20, 4);

// Add the night shift condition to the delete permission for user1
rbac.addConditionChecker('user1', DEFAULT.permissions.DELETE, nightShiftChecker);

// Function to check and log permissions
function checkAndLogPermission(hour: number) {
  const currentTime = new Date();
  currentTime.setHours(hour, 0, 0, 0);

  console.log(`\n--- Checking permissions at ${hour}:00 ---`);
  console.log('User1 can read:', rbac.hasPermission('user1', DEFAULT.permissions.READ, { currentTime }));
  console.log('User1 can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE, { currentTime }));
  console.log('User1 can delete:', rbac.hasPermission('user1', DEFAULT.permissions.DELETE, { currentTime }));
}

// Check permissions at different times
checkAndLogPermission(8);   // Before business hours
checkAndLogPermission(12);  // During business hours
checkAndLogPermission(18);  // After business hours
checkAndLogPermission(22);  // During night shift
checkAndLogPermission(3);   // During night shift (after midnight)
checkAndLogPermission(5);   // Outside both business hours and night shift