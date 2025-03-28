ALTER TABLE sessions ADD COLUMN userIp VARCHAR(45) NULL;
ALTER TABLE sessions MODIFY COLUMN data TEXT NULL;
ALTER TABLE comments ADD COLUMN branchId INTEGER NULL;
SELECT * FROM comments WHERE userId IS NULL;
SELECT * FROM comments WHERE userId = 1; -- 1 ni userId ga almashtiring
SELECT * FROM professions WHERE id IN (id1,id2);
SHOW TABLES FROM edecenter;
SHOW TABLES FROM edecenter;
SELECT * FROM edecenter.professions WHERE id IN (1, 2, 3);
