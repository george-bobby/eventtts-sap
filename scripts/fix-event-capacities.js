// Script to fix existing events with 0 capacity to unlimited capacity
// Run this script once to update existing events in the database

const { fixEventCapacities } = require('../lib/actions/event.action.ts');

async function runFix() {
  try {
    console.log('Starting to fix event capacities...');
    const result = await fixEventCapacities();
    console.log('✅ Successfully fixed event capacities!');
    console.log(`Updated ${result.modifiedCount} events`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing event capacities:', error);
    process.exit(1);
  }
}

runFix();
