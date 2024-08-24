// File: example-usage.ts
import * as ipaddr from 'ipaddr.js';

import { RBAC, Principal, User, DEFAULT, AdvancedIPChecker } from './rbac';

// Create a new RBAC instance with default roles
const rbac = RBAC.setupDefaultRoles();

// Add a user
rbac.addPrincipal({ id: 'user1', type: 'user', username: 'john_doe' } as User);

// Create a group and add the user to it
rbac.createGroup('group1', 'NetworkAdmins');
rbac.addToGroup('group1', 'user1');

// Assign the admin role to the group
rbac.assignRole('group1', 'admin');

// Create an advanced IP-based checker
const advancedIPChecker = new AdvancedIPChecker(
  ['192.168.1.100', '2001:db8::1'],                    // Allowed IPs
  ['10.0.0.0/8', '172.16.0.0/12', '2001:db8::/32'],    // Allowed Subnets
  ['192.168.1.200', '2001:db8::dead:beef'],            // Blocked IPs
  ['192.168.100.0/24', '2001:db8:1::/48']              // Blocked Subnets
);

// Add the advanced IP-based condition to the admin permission for user1
rbac.addConditionChecker('user1', DEFAULT.permissions.ADMIN, advancedIPChecker);

// Function to check and log permissions
function checkAndLogPermission(ip: string) {
  console.log(`\n--- Checking permissions for IP: ${ip} ---`);
  console.log('User1 can read:', rbac.hasPermission('user1', DEFAULT.permissions.READ, { ip }));
  console.log('User1 can write:', rbac.hasPermission('user1', DEFAULT.permissions.WRITE, { ip }));
  console.log('User1 has admin access:', rbac.hasPermission('user1', DEFAULT.permissions.ADMIN, { ip }));
}

// Check permissions from different IP addresses
checkAndLogPermission('192.168.1.100');   // Explicitly allowed IPv4
checkAndLogPermission('10.20.30.40');     // Allowed IPv4 subnet
checkAndLogPermission('192.168.1.200');   // Explicitly blocked IPv4
checkAndLogPermission('192.168.100.50');  // Blocked IPv4 subnet
checkAndLogPermission('203.0.113.1');     // IPv4 not in any list or subnet

checkAndLogPermission('2001:db8::1');           // Explicitly allowed IPv6
checkAndLogPermission('2001:db8:2::1');         // Allowed IPv6 subnet
checkAndLogPermission('2001:db8::dead:beef');   // Explicitly blocked IPv6
checkAndLogPermission('2001:db8:1::1');         // Blocked IPv6 subnet
checkAndLogPermission('2001:db8:ffff::1');      // IPv6 not in any list or subnet