ALTER TABLE `round_table_sessions` ADD `deliberationMode` varchar(20) DEFAULT 'parallel' NOT NULL;--> statement-breakpoint
ALTER TABLE `round_table_sessions` ADD `interruptionLog` text;--> statement-breakpoint
ALTER TABLE `round_table_sessions` ADD `streamId` varchar(64);--> statement-breakpoint
ALTER TABLE `round_table_sessions` ADD `isPaused` int DEFAULT 0 NOT NULL;