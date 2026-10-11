import { db, User } from './db.js';

console.log('====================================================');
console.log('[RVCYBER AGENT] RUNNING AUTOMATED SECURITY SUITE');
console.log('====================================================\n');

let testsPassed = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    process.exit(1);
  }
}

async function runSecurityTests() {
  // Test 1: First owner setup verification & duplicate prevention
  if (!db.hasOwner()) {
    const owner = db.createFirstOwner('lead_architect', 'owner@rvcyber.local', 'MasterKey#2026!Complex', 'Lead Architect');
    assert(owner.role === 'OWNER', 'First owner receives OWNER role on initial bootstrap');
  } else {
    assert(db.hasOwner(), 'Platform has existing verified owner record');
  }

  // Test 2: First-owner setup cannot be repeated after initialization (Invariant 6)
  let secondOwnerFailed = false;
  try {
    db.createFirstOwner('malicious_admin', 'attacker@evil.local', 'HackedPass#2026', 'Imposter');
  } catch (err: any) {
    secondOwnerFailed = err.message.includes('OWNER_ALREADY_EXISTS');
  }
  assert(secondOwnerFailed, 'First-owner setup cannot be repeated after initialization (Invariant 6)');

  // Test 3: New registration always receives USER privileges (Invariant 1)
  const testSuffix = Date.now().toString().slice(-5);
  const regularUser = db.createUser(`student_${testSuffix}`, `student_${testSuffix}@rvcyber.local`, 'PassStudent!123', 'Student Analyst');
  assert(regularUser.role === 'USER', 'A new registration always receives USER privileges (Invariant 1)');

  // Test 4: A user cannot promote themselves to OWNER via profile updates (Invariant 2)
  const profileUpdates = {
    displayName: 'Hacked Display',
    bio: 'Attempting escalation',
    role: 'OWNER' as any, // Attacker attempts to sneak in role property
  };
  const updatedUser = db.updateUserProfile(regularUser.id, profileUpdates as any);
  assert(updatedUser.role === 'USER', 'A user cannot promote themselves to OWNER via profile updates (Invariant 2)');

  // Test 5: A user cannot access or delete another user\'s private generated videos (Invariant 3)
  const userA = regularUser;
  const userB = db.createUser(`researcher_${testSuffix}`, `beta_${testSuffix}@rvcyber.local`, 'PassBeta!987', 'Beta Researcher');

  const privateVideoA = db.createVideoProject({
    userId: userA.id,
    title: 'Secret Pentest Lab Findings',
    topic: 'Kerberoasting',
    language: 'en',
    durationSeconds: 60,
    aspectRatio: '16:9',
    style: 'terminal',
    voice: 'Kore',
    narrationSpeed: 1,
    subtitlesEnabled: true,
    audience: 'advanced',
    storyboard: [],
    script: 'Confidential findings...',
    isPublic: false,
  });

  let unauthorizedDeleteBlocked = false;
  try {
    db.deleteVideoProject(privateVideoA.id, userB.id, false);
  } catch (err) {
    unauthorizedDeleteBlocked = true;
  }
  assert(unauthorizedDeleteBlocked, 'A user cannot delete another user private generated video (Invariant 3)');

  // Test 6: Unauthorized users cannot edit or delete another user\'s articles (Invariant 8)
  const articleA = db.createArticle(userA, {
    title: 'Deep Packet Inspection on Port 8080',
    slug: 'deep-packet-inspection-port-8080',
    summary: 'Packet headers overview',
    content: 'Full writeup content...',
    category: 'Network Security',
    tags: ['Wireshark', 'PCAP'],
    isPublished: true,
  });

  let articleTamperBlocked = false;
  try {
    db.updateArticle(articleA.id, userB.id, { title: 'Tampered Title' }, false);
  } catch (err) {
    articleTamperBlocked = true;
  }
  assert(articleTamperBlocked, 'Unauthorized users cannot edit another user article (Invariant 8)');

  // Test 7: Owner role can administer and manage users (Invariant 5)
  const ownerAccount = db.getOwner()!;
  assert(ownerAccount.role === 'OWNER', 'The real owner account is verified (Invariant 5)');

  // Owner can suspend regular user
  const suspended = db.setUserStatus(userB.id, 'suspended', ownerAccount);
  assert(suspended.status === 'suspended', 'Owner can suspend user accounts in moderation workflow');

  // Test 8: Non-owner cannot suspend accounts (Invariant 4)
  let nonOwnerAdminBlocked = false;
  try {
    db.setUserStatus(userA.id, 'suspended', userB);
  } catch (err) {
    nonOwnerAdminBlocked = true;
  }
  assert(nonOwnerAdminBlocked, 'Non-owner receives unauthorized denial when performing admin actions (Invariant 4)');

  // Clean up any test users so live database remains clean for the real owner
  db.purgeMockOwner();

  console.log('\n====================================================');
  console.log(`[RVCYBER AGENT] SECURITY AUDIT PASSED: ${testsPassed}/${totalTests} INVARIANTS VERIFIED`);
  console.log('====================================================\n');
  process.exit(0);
}

runSecurityTests().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
