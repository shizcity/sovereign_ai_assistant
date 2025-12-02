import { getAllSentinels } from "./server/sentinels-db.ts";

async function test() {
  try {
    console.log("Testing getAllSentinels...");
    const sentinels = await getAllSentinels();
    console.log(`Found ${sentinels.length} sentinels:`);
    sentinels.forEach(s => {
      console.log(`- ${s.symbolEmoji} ${s.name} (${s.slug})`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

test();
