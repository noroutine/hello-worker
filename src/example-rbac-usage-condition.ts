// File: example-usage.ts

import { RBAC, Principal, User, DEFAULT, TimeBasedChecker, IPBasedChecker } from './rbac';

// Create a new RBAC instance with default roles
const rbac = RBAC.setupDefaultRoles();

// Add a user
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_doe' } as User);

// Create a group and add the user to it
rbac.createGroup('group1', 'InternalEditors');
rbac.addToGroup('group1', 'user1');

// Assign the editor role to the group
rbac.assignRole('group1', 'editor');

// Create an IP-based checker for internal network (example IPs)
const internalIPChecker = new IPBasedChecker(['192.168.1.1', '192.168.1.2', '10.0.0.1']);

// Add the IP-based condition to the write permission for user1
rbac.addConditionChecker('user1', DEFAULT.permissions.WRITE, internalIPChecker);

// Function to check and log permissions
function checkAndLogPermission(ip: string) {
  console.log(`\n--- Checking permissions for IP: ${ip} ---`);
  console.log('User1 can read:', rbac.hasPermission('user1', DEFAULT.permissions.READ, { ip }));
  console.log('User1 can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE, { ip }));
}

// Check permissions from different IP addresses
checkAndLogPermission('192.168.1.1'); // Internal IP
checkAndLogPermission('10.0.0.1');    // Another internal IP
checkAndLogPermission('203.0.113.1'); // External IP

// Combine IP-based and time-based restrictions
const businessHoursChecker = new TimeBasedChecker(9, 17);
rbac.addConditionChecker('user1', DEFAULT.permissions.WRITE, businessHoursChecker);

function checkAndLogCombinedPermission(ip: string, hour: number) {
  // Mock the current time
  jest.spyOn(Date.prototype, 'getHours').mockReturnValue(hour);

  console.log(`\n--- Checking permissions for IP: ${ip} at ${hour}:00 ---`);
  console.log('User1 can read:', rbac.hasPermission('user1', DEFAULT.permissions.READ, { ip }));
  console.log('User1 can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE, { ip }));
}

// Check combined permissions
checkAndLogCombinedPermission('192.168.1.1', 12); // Internal IP, during business hours
checkAndLogCombinedPermission('192.168.1.1', 20); // Internal IP, after business hours
checkAndLogCombinedPermission('203.0.113.1', 12); // External IP, during business hours

// Clean up the mock
jest.restoreAllMocks();