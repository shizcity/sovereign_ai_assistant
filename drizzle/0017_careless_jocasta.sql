ALTER TABLE `sentinel_memory` ADD `relationshipLevel` enum('acquaintance','colleague','trusted_advisor','partner') DEFAULT 'acquaintance';--> statement-breakpoint
ALTER TABLE `sentinel_memory` ADD `userModel` text;--> statement-breakpoint
ALTER TABLE `sentinel_memory` ADD `topicSummary` text;--> statement-breakpoint
ALTER TABLE `sentinel_memory` ADD `roundTableCount` int DEFAULT 0;