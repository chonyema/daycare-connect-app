/**
 * Test script to verify expired offer position recalculation
 *
 * This script will:
 * 1. Show current waitlist entries and their positions
 * 2. Trigger the GET endpoint which includes the expired offer handling logic
 * 3. Show the updated positions after recalculation
 */

const BASE_URL = 'http://localhost:3000';

async function testExpiredOfferPositions() {
  console.log('='.repeat(80));
  console.log('Testing Expired Offer Position Recalculation');
  console.log('='.repeat(80));

  try {
    // First, let's get the parent ID from the database to use in the API call
    // You'll need to replace this with an actual parent ID from your system
    const parentId = 'your-parent-id-here'; // TODO: Replace with actual parent ID

    console.log('\n1️⃣  Fetching waitlist entries...\n');

    const response = await fetch(
      `${BASE_URL}/api/waitlist/enhanced?parentId=${parentId}&includeInactive=false`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ API returned error:', data.error);
      return;
    }

    console.log(`Found ${data.data.length} waitlist entries\n`);

    // Display each entry with details
    data.data.forEach((entry, index) => {
      console.log(`Entry #${index + 1}:`);
      console.log(`  Child: ${entry.childName}`);
      console.log(`  Daycare: ${entry.daycare.name}`);
      console.log(`  Status: ${entry.status}`);
      console.log(`  Position: #${entry.position}`);
      console.log(`  Priority Score: ${entry.priorityScore}`);
      console.log(`  Days on Waitlist: ${entry.daysOnWaitlist}`);
      console.log(`  Joined: ${new Date(entry.joinedAt).toLocaleDateString()}`);

      // Show offers
      if (entry.offers && entry.offers.length > 0) {
        console.log(`  Offers:`);
        entry.offers.forEach((offer, i) => {
          console.log(`    Offer ${i + 1}:`);
          console.log(`      Response: ${offer.response || 'PENDING'}`);
          console.log(`      Spot Available: ${new Date(offer.spotAvailableDate).toLocaleDateString()}`);
          console.log(`      Expires: ${new Date(offer.offerExpiresAt).toLocaleDateString()}`);
          console.log(`      Is Expired: ${offer.isExpired ? 'Yes' : 'No'}`);
          console.log(`      Can Respond: ${offer.canRespond ? 'Yes' : 'No'}`);
        });
      }

      console.log('');
    });

    // Show metadata
    console.log('\n📊 Summary:');
    console.log(`  Total Entries: ${data.meta.total}`);
    console.log(`  Active: ${data.meta.activeCount}`);
    console.log(`  Paused: ${data.meta.pausedCount}`);
    console.log(`  Offered: ${data.meta.offeredCount}`);

    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 What to look for:');
    console.log('  - Entries with expired offers should have status = "ACTIVE"');
    console.log('  - Their positions should be recalculated based on priority score');
    console.log('  - If they were #1 with a low priority score, they should move down');
    console.log('  - Check the "Expired Offers" section in the UI to see offer history');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }

  console.log('\n' + '='.repeat(80));
}

// Instructions for running the test
console.log(`
INSTRUCTIONS:
=============

1. Make sure your dev server is running on http://localhost:3000
2. Open this file and replace 'your-parent-id-here' with an actual parent ID
   - You can find parent IDs in Prisma Studio (http://localhost:5559)
   - Or check the browser console when logged in as a parent
3. Run this script: node test-expired-offer-position.js

ALTERNATIVE: Test via Browser Console
======================================

If you're logged in as a parent, paste this in the browser console:

fetch('/api/waitlist/enhanced?parentId=YOUR_PARENT_ID&includeInactive=false')
  .then(r => r.json())
  .then(data => {
    console.table(data.data.map(e => ({
      child: e.childName,
      status: e.status,
      position: e.position,
      priorityScore: e.priorityScore,
      hasExpiredOffer: e.offers?.some(o => o.isExpired || o.response === 'EXPIRED')
    })));
  });

`);

// Uncomment to run the test
// testExpiredOfferPositions();
