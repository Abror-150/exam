ALTER TABLE sessions ADD COLUMN userIp VARCHAR(45) NULL;
ALTER TABLE sessions MODIFY COLUMN data TEXT NULL;
ALTER TABLE comments ADD COLUMN branchId INTEGER NULL;
SELECT * FROM comments WHERE userId IS NULL;
SELECT * FROM comments WHERE userId = 1; -- 1 ni userId ga almashtiring
