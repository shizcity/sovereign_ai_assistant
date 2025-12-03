import { seedConversationTemplates } from "./server/seed-templates";

async function main() {
  try {
    console.log("Seeding conversation templates...");
    const count = await seedConversationTemplates(1); // User ID 1
    console.log(`✅ Successfully seeded ${count} conversation templates!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
}

main();
