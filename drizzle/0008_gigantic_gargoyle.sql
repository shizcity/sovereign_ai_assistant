CREATE TABLE `template_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`rating` int NOT NULL,
	`reviewText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_reviews_id` PRIMARY KEY(`id`)
);
