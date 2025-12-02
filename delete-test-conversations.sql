-- Delete all conversations with "Test" in the title
DELETE FROM messages WHERE conversationId IN (SELECT id FROM conversations WHERE title LIKE '%Test%');
DELETE FROM conversations WHERE title LIKE '%Test%';
