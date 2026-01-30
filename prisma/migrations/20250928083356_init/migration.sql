-- CreateEnum
CREATE TYPE "SCHEMA"."LogType" AS ENUM ('CHECK_IN', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "SCHEMA"."NotificationType" AS ENUM ('TODO', 'LEAVE', 'REQUISITION', 'HOLIDAY', 'EVENT', 'ACTIVITY', 'MESSAGE');

-- CreateEnum
CREATE TYPE "SCHEMA"."ReactionType" AS ENUM ('LOVE');

-- CreateEnum
CREATE TYPE "SCHEMA"."LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SCHEMA"."Gender" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "SCHEMA"."RequisitionType" AS ENUM ('HIRING', 'ASSET', 'TRAINING', 'TRAVEL', 'BUDGET', 'OTHERS');

-- CreateEnum
CREATE TYPE "SCHEMA"."RequisitionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RETURNED', 'EXPIRED', 'BROKEN');

-- CreateEnum
CREATE TYPE "SCHEMA"."PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SCHEMA"."TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW');

-- CreateEnum
CREATE TYPE "SCHEMA"."TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SCHEMA"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SCHEMA"."UserStatus" AS ENUM ('ACTIVATE', 'DEACTIVATE');

-- CreateEnum
CREATE TYPE "SCHEMA"."UserExitType" AS ENUM ('TERMINATED', 'RESIGNED');

-- CreateEnum
CREATE TYPE "SCHEMA"."FullWeek" AS ENUM ('SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- CreateEnum
CREATE TYPE "SCHEMA"."LeaveType" AS ENUM ('SICK', 'CASUAL', 'PAID', 'UNPAID');

-- CreateEnum
CREATE TYPE "SCHEMA"."UserPower" AS ENUM ('DASHBOARD', 'TRANSACTION', 'COMPANY', 'BRANCH', 'DEPARTMENT', 'USERS', 'REQUISITION', 'ATTENDANCE', 'LEAVE', 'TEAM');

-- CreateEnum
CREATE TYPE "SCHEMA"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'HR', 'INCHARGE', 'MANAGER');

-- CreateEnum
CREATE TYPE "SCHEMA"."AttendanceStatus" AS ENUM ('ON_TIME', 'LATE', 'HALF_DAY', 'ABSENT', 'LEAVE', 'ROASTER');

-- CreateTable
CREATE TABLE "SCHEMA"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "SCHEMA"."UserRole" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."VerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."user_details" (
    "id" SERIAL NOT NULL,
    "employeeId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fingerId" INTEGER,
    "nfcId" INTEGER,
    "email" TEXT NOT NULL,
    "gender" "SCHEMA"."Gender" NOT NULL,
    "address" TEXT NOT NULL,
    "skills" TEXT[],
    "hireDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "designation" TEXT NOT NULL,
    "contactNo" TEXT NOT NULL,
    "profileImage" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SCHEMA"."UserStatus" NOT NULL DEFAULT 'DEACTIVATE',
    "dateOfBirth" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "resignationDate" TIMESTAMP(3),
    "exitType" "SCHEMA"."UserExitType",
    "exitReason" TEXT,
    "lastWorkingDay" TIMESTAMP(3),
    "nidNo" TEXT,
    "nidImage" TEXT,
    "cvImages" TEXT[],
    "roasters" TEXT[],
    "departmentId" INTEGER NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."Review" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewerId" INTEGER NOT NULL,
    "revieweeId" INTEGER NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."Todo" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SCHEMA"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "SCHEMA"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."Account" (
    "id" SERIAL NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "branchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."Transaction" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "accountId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "branchId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "note" TEXT,
    "type" "SCHEMA"."TransactionType" NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."requisitions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SCHEMA"."RequisitionStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "SCHEMA"."PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "total" DOUBLE PRECISION NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "branchId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."requisition_items" (
    "id" SERIAL NOT NULL,
    "requisitionId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "SCHEMA"."RequisitionType" NOT NULL,
    "status" "SCHEMA"."RequisitionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisition_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."ChatRoom" (
    "id" SERIAL NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."Message" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "chatRoomId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."powers" (
    "id" SERIAL NOT NULL,
    "name" "SCHEMA"."UserPower" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "padImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."branches" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactNo" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "workingTimeStart" TEXT NOT NULL,
    "workingTimeEnd" TEXT NOT NULL,
    "weeklyWorkingDays" "SCHEMA"."FullWeek"[],
    "yearlyLeaveCount" INTEGER NOT NULL,
    "supervisorId" INTEGER,
    "branchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."leaves" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "SCHEMA"."LeaveType" NOT NULL DEFAULT 'CASUAL',
    "status" "SCHEMA"."LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "leaveDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."attendance" (
    "id" SERIAL NOT NULL,
    "fingerId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "SCHEMA"."AttendanceStatus" NOT NULL DEFAULT 'ON_TIME',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."AttendanceLog" (
    "id" SERIAL NOT NULL,
    "attendanceId" INTEGER NOT NULL,
    "type" "SCHEMA"."LogType" NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."holidays" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."events" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER,
    "branchId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."activities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "images" TEXT[],
    "description" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."ActivityReaction" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "SCHEMA"."ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."CommentReaction" (
    "id" SERIAL NOT NULL,
    "commentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "SCHEMA"."ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "SCHEMA"."NotificationType" NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "isSeen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."_AssignedTodos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AssignedTodos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "SCHEMA"."_UserDetailsPowers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserDetailsPowers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "SCHEMA"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCode_email_key" ON "SCHEMA"."VerificationCode"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_employeeId_key" ON "SCHEMA"."user_details"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_userId_key" ON "SCHEMA"."user_details"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_fingerId_key" ON "SCHEMA"."user_details"("fingerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_nfcId_key" ON "SCHEMA"."user_details"("nfcId");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_email_contactNo_key" ON "SCHEMA"."user_details"("email", "contactNo");

-- CreateIndex
CREATE UNIQUE INDEX "Account_branchId_key" ON "SCHEMA"."Account"("branchId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "SCHEMA"."Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_requestedById_idx" ON "SCHEMA"."Transaction"("requestedById");

-- CreateIndex
CREATE INDEX "Transaction_createdById_idx" ON "SCHEMA"."Transaction"("createdById");

-- CreateIndex
CREATE INDEX "requisitions_requestedById_idx" ON "SCHEMA"."requisitions"("requestedById");

-- CreateIndex
CREATE INDEX "requisitions_createdById_idx" ON "SCHEMA"."requisitions"("createdById");

-- CreateIndex
CREATE INDEX "requisitions_departmentId_idx" ON "SCHEMA"."requisitions"("departmentId");

-- CreateIndex
CREATE INDEX "requisitions_branchId_idx" ON "SCHEMA"."requisitions"("branchId");

-- CreateIndex
CREATE INDEX "requisitions_companyId_idx" ON "SCHEMA"."requisitions"("companyId");

-- CreateIndex
CREATE INDEX "ChatRoom_user1Id_idx" ON "SCHEMA"."ChatRoom"("user1Id");

-- CreateIndex
CREATE INDEX "ChatRoom_user2Id_idx" ON "SCHEMA"."ChatRoom"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "powers_name_key" ON "SCHEMA"."powers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "SCHEMA"."companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "branches_name_companyId_key" ON "SCHEMA"."branches"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_supervisorId_key" ON "SCHEMA"."departments"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_branchId_key" ON "SCHEMA"."departments"("name", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReaction_activityId_userId_key" ON "SCHEMA"."ActivityReaction"("activityId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReaction_commentId_userId_key" ON "SCHEMA"."CommentReaction"("commentId", "userId");

-- CreateIndex
CREATE INDEX "_AssignedTodos_B_index" ON "SCHEMA"."_AssignedTodos"("B");

-- CreateIndex
CREATE INDEX "_UserDetailsPowers_B_index" ON "SCHEMA"."_UserDetailsPowers"("B");

-- AddForeignKey
ALTER TABLE "SCHEMA"."user_details" ADD CONSTRAINT "user_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SCHEMA"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."user_details" ADD CONSTRAINT "user_details_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "SCHEMA"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Todo" ADD CONSTRAINT "Todo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Account" ADD CONSTRAINT "Account_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "SCHEMA"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SCHEMA"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Transaction" ADD CONSTRAINT "Transaction_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Transaction" ADD CONSTRAINT "Transaction_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "SCHEMA"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Transaction" ADD CONSTRAINT "Transaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "SCHEMA"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Transaction" ADD CONSTRAINT "Transaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "SCHEMA"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."requisitions" ADD CONSTRAINT "requisitions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "SCHEMA"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."requisitions" ADD CONSTRAINT "requisitions_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."requisitions" ADD CONSTRAINT "requisitions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."requisitions" ADD CONSTRAINT "requisitions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "SCHEMA"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."requisitions" ADD CONSTRAINT "requisitions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "SCHEMA"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."requisition_items" ADD CONSTRAINT "requisition_items_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "SCHEMA"."requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."ChatRoom" ADD CONSTRAINT "ChatRoom_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."ChatRoom" ADD CONSTRAINT "ChatRoom_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Message" ADD CONSTRAINT "Message_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "SCHEMA"."ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."branches" ADD CONSTRAINT "branches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "SCHEMA"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."departments" ADD CONSTRAINT "departments_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."departments" ADD CONSTRAINT "departments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "SCHEMA"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."leaves" ADD CONSTRAINT "leaves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."attendance" ADD CONSTRAINT "attendance_fingerId_fkey" FOREIGN KEY ("fingerId") REFERENCES "SCHEMA"."user_details"("fingerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."AttendanceLog" ADD CONSTRAINT "AttendanceLog_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "SCHEMA"."attendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."events" ADD CONSTRAINT "events_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "SCHEMA"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."events" ADD CONSTRAINT "events_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "SCHEMA"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Comment" ADD CONSTRAINT "Comment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "SCHEMA"."activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."ActivityReaction" ADD CONSTRAINT "ActivityReaction_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "SCHEMA"."activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."ActivityReaction" ADD CONSTRAINT "ActivityReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."CommentReaction" ADD CONSTRAINT "CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SCHEMA"."Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."CommentReaction" ADD CONSTRAINT "CommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "SCHEMA"."user_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."_AssignedTodos" ADD CONSTRAINT "_AssignedTodos_A_fkey" FOREIGN KEY ("A") REFERENCES "SCHEMA"."Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."_AssignedTodos" ADD CONSTRAINT "_AssignedTodos_B_fkey" FOREIGN KEY ("B") REFERENCES "SCHEMA"."user_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."_UserDetailsPowers" ADD CONSTRAINT "_UserDetailsPowers_A_fkey" FOREIGN KEY ("A") REFERENCES "SCHEMA"."powers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."_UserDetailsPowers" ADD CONSTRAINT "_UserDetailsPowers_B_fkey" FOREIGN KEY ("B") REFERENCES "SCHEMA"."user_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
