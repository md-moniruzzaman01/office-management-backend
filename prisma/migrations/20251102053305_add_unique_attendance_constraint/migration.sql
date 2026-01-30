/*
  Warnings:

  - A unique constraint covering the columns `[fingerId,date]` on the table `attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "attendance_fingerId_date_key" ON "SCHEMA"."attendance"("fingerId", "date");
