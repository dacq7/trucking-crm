-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VENDOR');

-- CreateEnum
CREATE TYPE "BusinessEntityType" AS ENUM ('LLC', 'CORPORATION', 'SOLE_PROPRIETOR', 'PARTNERSHIP');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('OTR', 'LOCAL', 'REGIONAL', 'INTERMODAL');

-- CreateEnum
CREATE TYPE "OperationRadius" AS ENUM ('LOCAL', 'REGIONAL', 'NATIONAL');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('TRACTOR', 'STRAIGHT_TRUCK', 'TRAILER', 'VAN', 'PICKUP', 'BOX_TRUCK');

-- CreateEnum
CREATE TYPE "VehicleOwnership" AS ENUM ('OWNED', 'LEASED', 'FINANCED');

-- CreateEnum
CREATE TYPE "LicenseClass" AS ENUM ('CLASS_A', 'CLASS_B', 'CLASS_C');

-- CreateEnum
CREATE TYPE "MVRStatus" AS ENUM ('CLEAN', 'MINOR_VIOLATIONS', 'MAJOR_VIOLATIONS');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND', 'POLICY_ISSUED', 'RENEWAL', 'LOST');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('PRIMARY_AUTO_LIABILITY', 'MOTOR_TRUCK_CARGO', 'PHYSICAL_DAMAGE_COMPREHENSIVE', 'PHYSICAL_DAMAGE_COLLISION', 'GENERAL_LIABILITY', 'NON_TRUCKING_LIABILITY', 'TRAILER_INTERCHANGE', 'OCCUPATIONAL_ACCIDENT');

-- CreateEnum
CREATE TYPE "PaymentPlan" AS ENUM ('FULL_PAY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "FilingStatus" AS ENUM ('FILED', 'PENDING', 'NOT_REQUIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VENDOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "legalBusinessName" TEXT NOT NULL,
    "dba" TEXT,
    "dotNumber" TEXT NOT NULL,
    "mcNumber" TEXT,
    "ein" TEXT,
    "yearsInBusiness" INTEGER,
    "entityType" "BusinessEntityType",
    "stateOfIncorporation" TEXT,
    "website" TEXT,
    "contactName" TEXT NOT NULL,
    "contactTitle" TEXT,
    "phonePrimary" TEXT NOT NULL,
    "phoneSecondary" TEXT,
    "email" TEXT NOT NULL,
    "preferredContact" TEXT,
    "physicalAddress" TEXT NOT NULL,
    "physicalCity" TEXT NOT NULL,
    "physicalState" TEXT NOT NULL,
    "physicalZip" TEXT NOT NULL,
    "mailingAddressSame" BOOLEAN NOT NULL DEFAULT true,
    "mailingAddress" TEXT,
    "mailingCity" TEXT,
    "mailingState" TEXT,
    "mailingZip" TEXT,
    "garagingAddress" TEXT,
    "garagingCity" TEXT,
    "garagingState" TEXT,
    "garagingZip" TEXT,
    "operationType" "OperationType",
    "operationRadius" "OperationRadius",
    "statesOfOperation" TEXT[],
    "crossesBorder" BOOLEAN NOT NULL DEFAULT false,
    "crossesBorderDetail" TEXT,
    "annualGrossRevenue" DOUBLE PRECISION,
    "ownerOperatorPct" INTEGER,
    "leasedToCarrier" BOOLEAN NOT NULL DEFAULT false,
    "leasedCarrierName" TEXT,
    "commodities" TEXT[],
    "hasHazmat" BOOLEAN NOT NULL DEFAULT false,
    "hazmatClass" TEXT,
    "currentlyInsured" BOOLEAN NOT NULL DEFAULT false,
    "currentCarrier" TEXT,
    "currentPremium" DOUBLE PRECISION,
    "reasonForShopping" TEXT,
    "priorCarrier" TEXT,
    "hadNonRenewal" BOOLEAN NOT NULL DEFAULT false,
    "nonRenewalReason" TEXT,
    "totalLossesPast3Yrs" INTEGER,
    "totalLossAmount" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "unitNumber" TEXT,
    "type" "VehicleType" NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "statedValue" DOUBLE PRECISION,
    "gvw" INTEGER,
    "ownership" "VehicleOwnership" NOT NULL,
    "lienholderName" TEXT,
    "lienholderAddress" TEXT,
    "currentlyInsured" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseState" TEXT NOT NULL,
    "licenseClass" "LicenseClass" NOT NULL,
    "cdlExperienceYears" INTEGER,
    "truckingExpYears" INTEGER,
    "mvrStatus" "MVRStatus" NOT NULL DEFAULT 'CLEAN',
    "violations" TEXT,
    "accidents" TEXT,
    "hasDUI" BOOLEAN NOT NULL DEFAULT false,
    "isOwnerOperator" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'LEAD',
    "notes" TEXT,
    "lostReason" TEXT,
    "clientId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_status_history" (
    "id" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "caseId" TEXT NOT NULL,

    CONSTRAINT "case_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverage_requests" (
    "id" TEXT NOT NULL,
    "coverageType" "CoverageType" NOT NULL,
    "limitRequested" DOUBLE PRECISION,
    "deductible" DOUBLE PRECISION,
    "requiresFMCSAFiling" BOOLEAN NOT NULL DEFAULT false,
    "hasRefrigeration" BOOLEAN NOT NULL DEFAULT false,
    "highValueCommodity" TEXT,
    "appliesToAllUnits" BOOLEAN NOT NULL DEFAULT true,
    "usesThirdPartyTrailers" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "caseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coverage_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "mga" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "totalAnnualPremium" DOUBLE PRECISION NOT NULL,
    "downPayment" DOUBLE PRECISION,
    "paymentPlan" "PaymentPlan" NOT NULL DEFAULT 'FULL_PAY',
    "financeCompany" TEXT,
    "filingStatus" "FilingStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "status" "PolicyStatus" NOT NULL DEFAULT 'ACTIVE',
    "coveragesSummary" TEXT,
    "remarks" TEXT,
    "caseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bound_coverages" (
    "id" TEXT NOT NULL,
    "coverageType" "CoverageType" NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "deductible" DOUBLE PRECISION,
    "premium" DOUBLE PRECISION,
    "notes" TEXT,
    "policyId" TEXT NOT NULL,

    CONSTRAINT "bound_coverages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_dotNumber_key" ON "clients"("dotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "cases_caseNumber_key" ON "cases"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "policies_policyNumber_key" ON "policies"("policyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "policies_caseId_key" ON "policies"("caseId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage_requests" ADD CONSTRAINT "coverage_requests_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bound_coverages" ADD CONSTRAINT "bound_coverages_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
