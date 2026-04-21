ALTER TABLE `round_table_reasoning` ADD `dissentScore` varchar(10);--> statement-breakpoint
ALTER TABLE `round_table_reasoning` ADD `isOutlier` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `round_table_sessions` ADD `contradictions` text;--> statement-breakpoint
ALTER TABLE `round_table_sessions` ADD `routingReason` text;