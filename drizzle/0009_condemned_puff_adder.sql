CREATE TABLE `template_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) NOT NULL DEFAULT '#3b82f6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `prompt_templates` ADD `categoryId` int;--> statement-breakpoint
ALTER TABLE `prompt_templates` DROP COLUMN `category`;