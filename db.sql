-- Active: 1742458197189@@127.0.0.1@3306@educenters



ALTER TABLE sessions MODIFY COLUMN userIp VARCHAR(45) NULL;
CREATE TABLE layklar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    learningCenterId INT NOT NULL,
    userId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
SELECT *from sessions ;
ALTER TABLE Comments ADD COLUMN branchId INTEGER NULL;

ALTER TABLE Comments ADD COLUMN branchId INTEGER NULL;
ALTER TABLE sessions MODIFY lastIp VARCHAR(45);


ALTER TABLE sessions ADD COLUMN userIp INTEGER NULL;


ALTER TABLE sessions DROP COLUMN ipAddress;


ALTER TABLE resource ADD COLUMN resourceCategoriesId INTEGER NULL;


DESCRIBE resource;


ALTER TABLE resources ADD COLUMN resourceCategoriesId INT;


SHOW COLUMNS FROM resources;


ALTER TABLE resources DROP COLUMN categoryId;

ALTER TABLE soxalar
CHANGE COLUMN professionId professionsId INT;


SELECT *from subjectbranches;
SELECT *from subjectcenters;

SELECT *from soxalar;
RENAME TABLE markazs TO markaz;
