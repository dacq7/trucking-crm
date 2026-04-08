require('dotenv').config()

const bcrypt = require('bcryptjs')
const prisma = require('../src/prisma')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dob(y, m, d) {
  return new Date(y, m - 1, d)
}

function isoDate(y, m, d) {
  return new Date(y, m - 1, d)
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const USERS = [
  {
    email: 'admin@premiertruckins.com',
    name: 'Administrador',
    password: 'Admin1234!',
    role: 'ADMIN',
    mustChangePassword: false,
  },
  {
    email: 'maria.gonzalez@premiertruckins.com',
    name: 'Maria Gonzalez',
    password: 'Vendor1234!',
    role: 'VENDOR',
    mustChangePassword: false,
  },
  {
    email: 'carlos.ruiz@premiertruckins.com',
    name: 'Carlos Ruiz',
    password: 'Vendor1234!',
    role: 'VENDOR',
    mustChangePassword: false,
  },
  {
    email: 'jennifer.davis@premiertruckins.com',
    name: 'Jennifer Davis',
    password: 'Vendor1234!',
    role: 'VENDOR',
    mustChangePassword: false,
  },
]

// ---------------------------------------------------------------------------
// Client data factory
// ---------------------------------------------------------------------------

function makeClient(overrides) {
  return {
    mailingAddressSame: true,
    operationType: 'OTR',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['TX', 'LA', 'MS', 'AL', 'FL'],
    crossesBorder: false,
    hasHazmat: false,
    currentlyInsured: true,
    hadNonRenewal: false,
    isActive: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Raw client definitions
// ---------------------------------------------------------------------------

const CLIENTS_RAW = [
  // ── Maria Gonzalez (3 clients) ──────────────────────────────────────────
  {
    legalBusinessName: 'Lone Star Freight LLC',
    dba: 'LSF Transport',
    dotNumber: '3401876',
    mcNumber: 'MC-789456',
    ein: '74-1234567',
    yearsInBusiness: 8,
    entityType: 'LLC',
    stateOfIncorporation: 'TX',
    contactName: 'Robert "Bobby" Salinas',
    contactTitle: 'Owner/Operator',
    phonePrimary: '(713) 555-0192',
    email: 'bobby.salinas@lonestarfreight.com',
    physicalAddress: '4210 Almeda Rd',
    physicalCity: 'Houston',
    physicalState: 'TX',
    physicalZip: '77004',
    operationType: 'OTR',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['TX', 'LA', 'MS', 'TN', 'GA', 'FL'],
    commodities: ['Dry Van', 'General Freight', 'Auto Parts'],
    currentlyInsured: true,
    currentCarrier: 'Progressive Commercial',
    currentPremium: 28500,
    annualGrossRevenue: 1850000,
    ownerOperatorPct: 0,
    totalLossesPast3Yrs: 1,
    totalLossAmount: 18000,
    _vendorKey: 'maria',
    _vehicles: [
      { unitNumber: 'TX-101', type: 'TRACTOR', year: 2021, make: 'Peterbilt', model: '579', vin: '1XPWD40X1ED215307', statedValue: 95000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'TX-102', type: 'TRACTOR', year: 2019, make: 'Kenworth', model: 'T680', vin: '2NKHHM6X5EM395678', statedValue: 72000, gvw: 80000, ownership: 'OWNED' },
      { unitNumber: 'TX-103', type: 'TRAILER', year: 2020, make: 'Wabash', model: 'Duraplate', vin: '1JJV532D5KL914321', statedValue: 28000, gvw: 45000, ownership: 'OWNED' },
    ],
    _drivers: [
      { fullName: 'Roberto Salinas Jr.', dateOfBirth: dob(1982, 6, 14), licenseNumber: 'TX8234561', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 12, truckingExpYears: 14, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: true },
      { fullName: 'Marcus D. Williams', dateOfBirth: dob(1990, 3, 22), licenseNumber: 'TX9345672', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 6, truckingExpYears: 8, mvrStatus: 'MINOR_VIOLATIONS', violations: '1 speeding ticket (2022)', hasDUI: false, isOwnerOperator: false },
    ],
  },
  {
    legalBusinessName: 'Gulf Coast Carriers Inc',
    dotNumber: '2867543',
    mcNumber: 'MC-567890',
    ein: '74-2345678',
    yearsInBusiness: 14,
    entityType: 'CORPORATION',
    stateOfIncorporation: 'TX',
    contactName: 'Sandra K. Moreno',
    contactTitle: 'President',
    phonePrimary: '(361) 555-0247',
    email: 'smoreno@gulfcoastcarriers.com',
    physicalAddress: '7820 Navigation Blvd',
    physicalCity: 'Corpus Christi',
    physicalState: 'TX',
    physicalZip: '78409',
    operationType: 'OTR',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['TX', 'LA', 'NM', 'AZ', 'CA'],
    commodities: ['Steel', 'Machinery', 'Flatbed Loads'],
    currentlyInsured: true,
    currentCarrier: 'Protective Insurance',
    currentPremium: 42000,
    annualGrossRevenue: 3200000,
    ownerOperatorPct: 20,
    totalLossesPast3Yrs: 2,
    totalLossAmount: 45000,
    _vendorKey: 'maria',
    _vehicles: [
      { unitNumber: 'GCC-01', type: 'TRACTOR', year: 2022, make: 'Freightliner', model: 'Cascadia 126', vin: '3AKJGLD59FSGH1234', statedValue: 115000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'GCC-02', type: 'TRACTOR', year: 2020, make: 'Freightliner', model: 'Cascadia 116', vin: '1FUJGLD56ELAU5678', statedValue: 88000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'GCC-F01', type: 'TRAILER', year: 2019, make: 'Fontaine', model: 'Magnitude 55', vin: '4F92B482XKF019234', statedValue: 65000, gvw: 80000, ownership: 'OWNED' },
    ],
    _drivers: [
      { fullName: 'James T. Broussard', dateOfBirth: dob(1975, 11, 8), licenseNumber: 'TX7123498', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 22, truckingExpYears: 25, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: false },
      { fullName: 'Hector M. Garza', dateOfBirth: dob(1988, 7, 30), licenseNumber: 'TX8901234', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 9, truckingExpYears: 9, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: false },
    ],
  },
  {
    legalBusinessName: 'Bayou Express Transport LLC',
    dotNumber: '1954321',
    mcNumber: 'MC-456789',
    ein: '74-3456789',
    yearsInBusiness: 5,
    entityType: 'LLC',
    stateOfIncorporation: 'TX',
    contactName: 'Travis J. Fontenot',
    contactTitle: 'Owner',
    phonePrimary: '(409) 555-0381',
    email: 'travis@bayouexpress.com',
    physicalAddress: '1450 Hwy 69 S',
    physicalCity: 'Beaumont',
    physicalState: 'TX',
    physicalZip: '77701',
    operationType: 'REGIONAL',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['TX', 'LA', 'MS', 'AR'],
    commodities: ['General Freight', 'Produce', 'Refrigerated Goods'],
    currentlyInsured: false,
    annualGrossRevenue: 780000,
    ownerOperatorPct: 100,
    totalLossesPast3Yrs: 0,
    totalLossAmount: 0,
    _vendorKey: 'maria',
    _vehicles: [
      { unitNumber: 'BET-01', type: 'TRACTOR', year: 2018, make: 'International', model: 'LT625', vin: '3HSDZAPR7LN543210', statedValue: 58000, gvw: 80000, ownership: 'OWNED' },
      { unitNumber: 'BET-R01', type: 'TRAILER', year: 2020, make: 'Utility', model: '3000R', vin: '1UYVS2539LU234512', statedValue: 42000, gvw: 45000, ownership: 'FINANCED' },
    ],
    _drivers: [
      { fullName: 'Travis J. Fontenot', dateOfBirth: dob(1986, 4, 19), licenseNumber: 'TX9012345', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 5, truckingExpYears: 7, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: true },
    ],
  },

  // ── Carlos Ruiz (4 clients) ──────────────────────────────────────────────
  {
    legalBusinessName: 'Rio Grande Logistics LLC',
    dotNumber: '4123789',
    mcNumber: 'MC-890123',
    ein: '74-4567890',
    yearsInBusiness: 11,
    entityType: 'LLC',
    stateOfIncorporation: 'TX',
    contactName: 'Ana L. Delgado',
    contactTitle: 'Operations Manager',
    phonePrimary: '(956) 555-0512',
    email: 'adelgado@riograndelogistics.com',
    physicalAddress: '3310 Mines Rd',
    physicalCity: 'Laredo',
    physicalState: 'TX',
    physicalZip: '78046',
    operationType: 'INTERMODAL',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['TX', 'NM', 'AZ', 'CA', 'NV'],
    commodities: ['Automotive Parts', 'Manufacturing Components', 'Electronics'],
    currentlyInsured: true,
    currentCarrier: 'Canal Insurance',
    currentPremium: 38000,
    annualGrossRevenue: 2900000,
    ownerOperatorPct: 0,
    leasedToCarrier: true,
    leasedCarrierName: 'Werner Enterprises',
    totalLossesPast3Yrs: 1,
    totalLossAmount: 22000,
    _vendorKey: 'carlos',
    _vehicles: [
      { unitNumber: 'RGL-01', type: 'TRACTOR', year: 2023, make: 'Kenworth', model: 'T680E', vin: '2NKHHM6X8PM445678', statedValue: 155000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'RGL-02', type: 'TRACTOR', year: 2022, make: 'Kenworth', model: 'T680', vin: '2NKHHM6X5NM334567', statedValue: 125000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'RGL-C01', type: 'TRAILER', year: 2021, make: 'CIMC', model: '40ft Container', vin: 'CSQG1234567890012', statedValue: 35000, gvw: 65000, ownership: 'OWNED' },
    ],
    _drivers: [
      { fullName: 'Eduardo R. Dominguez', dateOfBirth: dob(1979, 9, 3), licenseNumber: 'TX6789012', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 18, truckingExpYears: 20, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: false },
      { fullName: 'Miguel A. Reyes', dateOfBirth: dob(1993, 1, 27), licenseNumber: 'TX8765432', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 4, truckingExpYears: 5, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: false },
    ],
  },
  {
    legalBusinessName: 'Panhandle Freight Co',
    dotNumber: '5234567',
    mcNumber: 'MC-901234',
    ein: '75-1234567',
    yearsInBusiness: 19,
    entityType: 'CORPORATION',
    stateOfIncorporation: 'TX',
    contactName: 'Bill W. Hutchinson',
    contactTitle: 'CEO',
    phonePrimary: '(806) 555-0623',
    email: 'bill@panhandlefreight.com',
    physicalAddress: '5001 Airport Blvd',
    physicalCity: 'Amarillo',
    physicalState: 'TX',
    physicalZip: '79111',
    operationType: 'OTR',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['TX', 'OK', 'KS', 'CO', 'NM', 'MO'],
    commodities: ['Dry Van', 'Grain', 'Agricultural Products'],
    currentlyInsured: true,
    currentCarrier: 'Great West Casualty',
    currentPremium: 31000,
    annualGrossRevenue: 2100000,
    ownerOperatorPct: 30,
    totalLossesPast3Yrs: 0,
    totalLossAmount: 0,
    _vendorKey: 'carlos',
    _vehicles: [
      { unitNumber: 'PHF-01', type: 'TRACTOR', year: 2020, make: 'Peterbilt', model: '389', vin: '1XPBD49X8JD456789', statedValue: 82000, gvw: 80000, ownership: 'OWNED' },
      { unitNumber: 'PHF-02', type: 'TRACTOR', year: 2021, make: 'Peterbilt', model: '389', vin: '1XPBD49X9MD567890', statedValue: 88000, gvw: 80000, ownership: 'OWNED' },
    ],
    _drivers: [
      { fullName: 'William "Bill" Hutchinson', dateOfBirth: dob(1970, 12, 5), licenseNumber: 'TX5678901', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 28, truckingExpYears: 30, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: true },
      { fullName: 'Dale E. Simmons', dateOfBirth: dob(1985, 8, 11), licenseNumber: 'TX7890123', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 14, truckingExpYears: 16, mvrStatus: 'MINOR_VIOLATIONS', violations: '1 logbook violation (2021)', hasDUI: false, isOwnerOperator: false },
    ],
  },
  {
    legalBusinessName: 'Texas Plains Trucking LLC',
    dotNumber: '6345678',
    mcNumber: 'MC-012345',
    ein: '75-2345678',
    yearsInBusiness: 3,
    entityType: 'LLC',
    stateOfIncorporation: 'TX',
    contactName: 'Kevin T. Okafor',
    contactTitle: 'Owner',
    phonePrimary: '(214) 555-0734',
    email: 'kokafor@texasplains.com',
    physicalAddress: '9180 Forney Rd',
    physicalCity: 'Dallas',
    physicalState: 'TX',
    physicalZip: '75227',
    operationType: 'OTR',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['TX', 'OK', 'AR', 'TN', 'KY', 'OH'],
    commodities: ['Temperature Controlled', 'Produce', 'Dairy'],
    currentlyInsured: false,
    annualGrossRevenue: 420000,
    ownerOperatorPct: 100,
    totalLossesPast3Yrs: 0,
    totalLossAmount: 0,
    _vendorKey: 'carlos',
    _vehicles: [
      { unitNumber: 'TPT-01', type: 'TRACTOR', year: 2017, make: 'Volvo', model: 'VNL 760', vin: '4V4NC9EH8EN159876', statedValue: 55000, gvw: 80000, ownership: 'OWNED' },
      { unitNumber: 'TPT-R01', type: 'TRAILER', year: 2018, make: 'Great Dane', model: 'Champion Reefer', vin: '1GRAA9629JB225678', statedValue: 45000, gvw: 45000, ownership: 'FINANCED' },
    ],
    _drivers: [
      { fullName: 'Kevin T. Okafor', dateOfBirth: dob(1990, 5, 17), licenseNumber: 'TX9123456', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 3, truckingExpYears: 3, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: true },
    ],
  },
  {
    legalBusinessName: 'Permian Basin Oilfield Transport Inc',
    dotNumber: '7456123',
    mcNumber: 'MC-123456',
    ein: '75-3456789',
    yearsInBusiness: 7,
    entityType: 'CORPORATION',
    stateOfIncorporation: 'TX',
    contactName: 'Chad L. Brewer',
    contactTitle: 'VP Operations',
    phonePrimary: '(432) 555-0845',
    email: 'cbrewer@permianbasinot.com',
    physicalAddress: '2240 Andrews Hwy',
    physicalCity: 'Midland',
    physicalState: 'TX',
    physicalZip: '79703',
    operationType: 'OTR',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['TX', 'NM', 'OK', 'LA', 'CO'],
    commodities: ['Oilfield Equipment', 'Chemicals', 'Hazmat Loads'],
    hasHazmat: true,
    hazmatClass: 'Class 3 (Flammable Liquids), Class 8 (Corrosives)',
    currentlyInsured: true,
    currentCarrier: 'Markel Insurance',
    currentPremium: 67000,
    annualGrossRevenue: 4800000,
    ownerOperatorPct: 0,
    totalLossesPast3Yrs: 1,
    totalLossAmount: 35000,
    _vendorKey: 'carlos',
    _vehicles: [
      { unitNumber: 'PBO-01', type: 'TRACTOR', year: 2022, make: 'Mack', model: 'Anthem 64T', vin: '1M2AX09C1DM012345', statedValue: 142000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'PBO-02', type: 'TRACTOR', year: 2021, make: 'Mack', model: 'Anthem 64T', vin: '1M2AX09C3LM023456', statedValue: 128000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'PBO-T01', type: 'TRAILER', year: 2020, make: 'Brenner', model: 'Chemical Tanker', vin: '1B9TK4829LB567890', statedValue: 88000, gvw: 80000, ownership: 'OWNED' },
    ],
    _drivers: [
      { fullName: 'Raymond J. Castillo', dateOfBirth: dob(1977, 2, 14), licenseNumber: 'TX6012345', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 20, truckingExpYears: 22, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: false },
      { fullName: 'Bobby D. Nash', dateOfBirth: dob(1983, 10, 9), licenseNumber: 'TX7234560', licenseState: 'TX', licenseClass: 'CLASS_A', cdlExperienceYears: 15, truckingExpYears: 18, mvrStatus: 'MINOR_VIOLATIONS', violations: '1 overweight citation (2023)', hasDUI: false, isOwnerOperator: false },
    ],
  },

  // ── Jennifer Davis (3 clients) ───────────────────────────────────────────
  {
    legalBusinessName: 'Sunshine State Haulers LLC',
    dotNumber: '8567890',
    mcNumber: 'MC-234567',
    ein: '59-1234567',
    yearsInBusiness: 6,
    entityType: 'LLC',
    stateOfIncorporation: 'FL',
    contactName: 'Patricia A. Thornton',
    contactTitle: 'Owner',
    phonePrimary: '(813) 555-0956',
    email: 'pat@sunshinestatehaulers.com',
    physicalAddress: '8320 E Hillsborough Ave',
    physicalCity: 'Tampa',
    physicalState: 'FL',
    physicalZip: '33610',
    operationType: 'REGIONAL',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['FL', 'GA', 'SC', 'NC', 'VA'],
    commodities: ['Fresh Produce', 'Refrigerated Goods', 'Seafood'],
    currentlyInsured: true,
    currentCarrier: 'Canal Insurance',
    currentPremium: 24500,
    annualGrossRevenue: 1200000,
    ownerOperatorPct: 50,
    totalLossesPast3Yrs: 0,
    totalLossAmount: 0,
    _vendorKey: 'jennifer',
    _vehicles: [
      { unitNumber: 'SSH-01', type: 'TRACTOR', year: 2021, make: 'International', model: 'LT625', vin: '3HSDZAPR8MN654321', statedValue: 92000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'SSH-R01', type: 'TRAILER', year: 2019, make: 'Utility', model: '3000R Reefer', vin: '1UYVS2531KU345612', statedValue: 44000, gvw: 45000, ownership: 'OWNED' },
    ],
    _drivers: [
      { fullName: 'Patricia A. Thornton', dateOfBirth: dob(1984, 6, 28), licenseNumber: 'FL7890123', licenseState: 'FL', licenseClass: 'CLASS_A', cdlExperienceYears: 7, truckingExpYears: 9, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: true },
      { fullName: 'Darnell K. Jackson', dateOfBirth: dob(1991, 12, 3), licenseNumber: 'FL8901234', licenseState: 'FL', licenseClass: 'CLASS_A', cdlExperienceYears: 4, truckingExpYears: 4, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: false },
    ],
  },
  {
    legalBusinessName: 'Palmetto Heavy Transport Inc',
    dotNumber: '9678901',
    mcNumber: 'MC-345678',
    ein: '59-2345678',
    yearsInBusiness: 22,
    entityType: 'CORPORATION',
    stateOfIncorporation: 'FL',
    contactName: 'George W. Harrington',
    contactTitle: 'President',
    phonePrimary: '(904) 555-1067',
    email: 'george@palmettoheavy.com',
    physicalAddress: '4450 Blanding Blvd',
    physicalCity: 'Jacksonville',
    physicalState: 'FL',
    physicalZip: '32210',
    operationType: 'OTR',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['FL', 'GA', 'AL', 'MS', 'LA', 'TX'],
    commodities: ['Heavy Equipment', 'Construction Machinery', 'Oversized Loads'],
    currentlyInsured: true,
    currentCarrier: 'Protective Insurance',
    currentPremium: 78000,
    annualGrossRevenue: 5600000,
    ownerOperatorPct: 0,
    totalLossesPast3Yrs: 2,
    totalLossAmount: 95000,
    _vendorKey: 'jennifer',
    _vehicles: [
      { unitNumber: 'PHT-01', type: 'TRACTOR', year: 2023, make: 'Kenworth', model: 'W990', vin: '2NKWHM0X4PN778901', statedValue: 175000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'PHT-02', type: 'TRACTOR', year: 2022, make: 'Kenworth', model: 'W900L', vin: '2NKWHM0X2NM667890', statedValue: 148000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'PHT-LB01', type: 'TRAILER', year: 2020, make: 'Landoll', model: '440B Traveling Axle', vin: '1L9F548H9LF101234', statedValue: 95000, gvw: 80000, ownership: 'OWNED' },
    ],
    _drivers: [
      { fullName: 'George W. Harrington Jr.', dateOfBirth: dob(1968, 3, 19), licenseNumber: 'FL5678901', licenseState: 'FL', licenseClass: 'CLASS_A', cdlExperienceYears: 35, truckingExpYears: 38, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: false },
      { fullName: 'Terrence L. Coleman', dateOfBirth: dob(1978, 9, 7), licenseNumber: 'FL6789012', licenseState: 'FL', licenseClass: 'CLASS_A', cdlExperienceYears: 24, truckingExpYears: 26, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: false },
    ],
  },
  {
    legalBusinessName: 'Emerald Coast Logistics LLC',
    dotNumber: '1789012',
    mcNumber: 'MC-456789',
    ein: '59-3456789',
    yearsInBusiness: 4,
    entityType: 'LLC',
    stateOfIncorporation: 'FL',
    contactName: 'Stephanie R. Walters',
    contactTitle: 'Owner/Operator',
    phonePrimary: '(850) 555-1178',
    email: 'stephanie@emeraldcoastlogistics.com',
    physicalAddress: '100 E Gregory St',
    physicalCity: 'Pensacola',
    physicalState: 'FL',
    physicalZip: '32502',
    operationType: 'OTR',
    operationRadius: 'NATIONAL',
    statesOfOperation: ['FL', 'AL', 'MS', 'LA', 'TX', 'GA'],
    commodities: ['Consumer Goods', 'Retail Merchandise', 'Dry Van'],
    currentlyInsured: false,
    annualGrossRevenue: 560000,
    ownerOperatorPct: 100,
    totalLossesPast3Yrs: 0,
    totalLossAmount: 0,
    _vendorKey: 'jennifer',
    _vehicles: [
      { unitNumber: 'ECL-01', type: 'TRACTOR', year: 2019, make: 'Freightliner', model: 'Cascadia 125', vin: '1FUJGLDR7KLBZ1234', statedValue: 65000, gvw: 80000, ownership: 'FINANCED' },
      { unitNumber: 'ECL-T01', type: 'TRAILER', year: 2020, make: 'Wabash', model: 'Duraplate DW', vin: '1JJV532D0LL914567', statedValue: 27000, gvw: 45000, ownership: 'OWNED' },
    ],
    _drivers: [
      { fullName: 'Stephanie R. Walters', dateOfBirth: dob(1989, 7, 14), licenseNumber: 'FL9012345', licenseState: 'FL', licenseClass: 'CLASS_A', cdlExperienceYears: 4, truckingExpYears: 4, mvrStatus: 'CLEAN', hasDUI: false, isOwnerOperator: true },
    ],
  },
]

// ---------------------------------------------------------------------------
// Case plan: 20 cases (2 per client)
// Format: [statusPipeline[], lostReason?, policyData?]
// ---------------------------------------------------------------------------

const CASE_PLAN = [
  // Client 0: Lone Star Freight — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND', 'POLICY_ISSUED'],
    notes: 'Renewal from Progressive. Client wants better rates on Physical Damage.',
    policy: {
      policyNumber: 'TRK-2024-001847',
      carrier: 'Canal Insurance Company',
      mga: 'AmTrust Financial Services',
      effectiveDate: isoDate(2024, 2, 1),
      expirationDate: isoDate(2025, 2, 1),
      totalAnnualPremium: 26800,
      downPayment: 6700,
      paymentPlan: 'QUARTERLY',
      filingStatus: 'FILED',
      status: 'ACTIVE',
      coveragesSummary: 'Primary Auto Liability $1M, MTC $100k, PD Comp/Coll',
      boundCoverages: [
        { coverageType: 'PRIMARY_AUTO_LIABILITY', limit: 1000000, deductible: 1000, premium: 18500 },
        { coverageType: 'MOTOR_TRUCK_CARGO', limit: 100000, deductible: 1000, premium: 4200 },
        { coverageType: 'PHYSICAL_DAMAGE_COMPREHENSIVE', limit: 167000, deductible: 2500, premium: 2100 },
        { coverageType: 'PHYSICAL_DAMAGE_COLLISION', limit: 167000, deductible: 5000, premium: 2000 },
      ],
    },
  },
  {
    pipeline: ['LEAD', 'PROSPECT', 'QUOTE_SENT'],
    notes: 'Client interested in adding trailer interchange coverage for drop yard operations.',
  },

  // Client 1: Gulf Coast Carriers — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND', 'POLICY_ISSUED'],
    notes: 'Large flatbed operation. Needed GL + MTC for steel loads. Multi-carrier solution.',
    policy: {
      policyNumber: 'TRK-2024-002391',
      carrier: 'Protective Insurance Company',
      mga: null,
      effectiveDate: isoDate(2024, 3, 15),
      expirationDate: isoDate(2025, 3, 15),
      totalAnnualPremium: 41200,
      downPayment: 10300,
      paymentPlan: 'QUARTERLY',
      filingStatus: 'FILED',
      status: 'ACTIVE',
      coveragesSummary: 'Primary AL $1M, MTC $150k, GL $1M, PD Comp/Coll',
      boundCoverages: [
        { coverageType: 'PRIMARY_AUTO_LIABILITY', limit: 1000000, deductible: 1000, premium: 22000 },
        { coverageType: 'MOTOR_TRUCK_CARGO', limit: 150000, deductible: 2500, premium: 7500 },
        { coverageType: 'GENERAL_LIABILITY', limit: 1000000, deductible: 0, premium: 6200 },
        { coverageType: 'PHYSICAL_DAMAGE_COMPREHENSIVE', limit: 303000, deductible: 2500, premium: 3200 },
        { coverageType: 'PHYSICAL_DAMAGE_COLLISION', limit: 303000, deductible: 5000, premium: 2300 },
      ],
    },
  },
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION'],
    notes: 'Exploring options for adding 2 more tractors mid-term. Holding for finalized fleet list.',
  },

  // Client 2: Bayou Express — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND', 'POLICY_ISSUED'],
    notes: 'First-time insured operation. New venture, good MVR. Competitive market.',
    policy: {
      policyNumber: 'TRK-2024-003654',
      carrier: 'Progressive Commercial',
      mga: null,
      effectiveDate: isoDate(2024, 5, 1),
      expirationDate: isoDate(2025, 5, 1),
      totalAnnualPremium: 14900,
      downPayment: 3725,
      paymentPlan: 'QUARTERLY',
      filingStatus: 'FILED',
      status: 'ACTIVE',
      coveragesSummary: 'Primary AL $1M, MTC $75k, Non-Trucking Liability',
      boundCoverages: [
        { coverageType: 'PRIMARY_AUTO_LIABILITY', limit: 1000000, deductible: 1000, premium: 9800 },
        { coverageType: 'MOTOR_TRUCK_CARGO', limit: 75000, deductible: 1500, premium: 3100 },
        { coverageType: 'NON_TRUCKING_LIABILITY', limit: 500000, deductible: 0, premium: 2000 },
      ],
    },
  },
  {
    pipeline: ['LEAD'],
    notes: 'Client referred by Bobby Salinas. Needs coverage for new reefer trailer.',
  },

  // Client 3: Rio Grande Logistics — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND', 'POLICY_ISSUED'],
    notes: 'Intermodal operation. Required high MTC limits for automotive parts. Filed with FMCSA.',
    policy: {
      policyNumber: 'TRK-2024-004218',
      carrier: 'Canal Insurance Company',
      mga: 'Nationwide Agribusiness',
      effectiveDate: isoDate(2024, 1, 15),
      expirationDate: isoDate(2025, 1, 15),
      totalAnnualPremium: 36500,
      downPayment: 9125,
      paymentPlan: 'QUARTERLY',
      filingStatus: 'FILED',
      status: 'ACTIVE',
      coveragesSummary: 'Primary AL $1M, MTC $250k, GL $1M, Trailer Interchange',
      boundCoverages: [
        { coverageType: 'PRIMARY_AUTO_LIABILITY', limit: 1000000, deductible: 1000, premium: 19500 },
        { coverageType: 'MOTOR_TRUCK_CARGO', limit: 250000, deductible: 2500, premium: 8800 },
        { coverageType: 'GENERAL_LIABILITY', limit: 1000000, deductible: 0, premium: 5200 },
        { coverageType: 'TRAILER_INTERCHANGE', limit: 35000, deductible: 1000, premium: 3000 },
      ],
    },
  },
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND'],
    notes: 'Adding 2 new tractors to fleet. Working on updated values for Physical Damage.',
  },

  // Client 4: Panhandle Freight — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND', 'POLICY_ISSUED'],
    notes: 'Long-time client renewing. Great loss history. Secured preferred pricing with Great West.',
    policy: {
      policyNumber: 'TRK-2024-005087',
      carrier: 'Great West Casualty Company',
      mga: null,
      effectiveDate: isoDate(2024, 4, 1),
      expirationDate: isoDate(2025, 4, 1),
      totalAnnualPremium: 29800,
      downPayment: 7450,
      paymentPlan: 'QUARTERLY',
      filingStatus: 'FILED',
      status: 'ACTIVE',
      coveragesSummary: 'Primary AL $1M, MTC $100k, GL $1M, OA',
      boundCoverages: [
        { coverageType: 'PRIMARY_AUTO_LIABILITY', limit: 1000000, deductible: 1000, premium: 17500 },
        { coverageType: 'MOTOR_TRUCK_CARGO', limit: 100000, deductible: 1000, premium: 4800 },
        { coverageType: 'GENERAL_LIABILITY', limit: 1000000, deductible: 0, premium: 4500 },
        { coverageType: 'OCCUPATIONAL_ACCIDENT', limit: 500000, deductible: 0, premium: 3000 },
      ],
    },
  },
  {
    pipeline: ['LEAD', 'PROSPECT', 'QUOTE_SENT'],
    notes: 'Client exploring Occupational Accident standalone policy for owner-operator drivers.',
  },

  // Client 5: Texas Plains — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION'],
    notes: 'New operation. 3 years experience only. Working with Progressive and Canal for quotes.',
  },
  {
    pipeline: ['LEAD', 'PROSPECT'],
    notes: 'Referred by Panhandle Freight. New reefer venture. Need refrigeration breakdown coverage.',
  },

  // Client 6: Permian Basin Oilfield — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND'],
    notes: 'Hazmat operation. Required surplus lines market. Markel came in competitive on renewal.',
  },
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE'],
    notes: 'Adding chemical tanker to fleet. Needs separate endorsement for Hazmat Pollution.',
  },

  // Client 7: Sunshine State — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT'],
    notes: 'Seasonal reefer operation. Peak season April-October. Shopping for better produce cargo limits.',
  },
  {
    pipeline: ['LEAD'],
    notes: 'New referral. Owner-operator running under own authority. First year under own MC.',
  },

  // Client 8: Palmetto Heavy — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION'],
    notes: 'Complex risk — oversized loads to 250k lbs. Protective is the preferred carrier. Loss history review needed.',
  },
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'NEGOTIATION', 'BOUND'],
    notes: 'Adding 3rd unit. Updating fleet schedule. Binding subject to new VIN confirmation.',
  },

  // Client 9: Emerald Coast — 2 cases
  {
    pipeline: ['LEAD', 'PROSPECT'],
    notes: 'Owner-operator first time getting own authority. Coming off lease. Good MVR.',
  },
  {
    pipeline: ['LEAD', 'PROSPECT', 'APPLICATION_COMPLETE', 'QUOTE_SENT', 'LOST'],
    lostReason: 'Client decided to stay leased to carrier — not ready for independent authority.',
    notes: 'Unable to compete on price. Client went with carrier-provided coverage.',
  },
]

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱  Premier Trucking Insurance — Seed iniciando...')

  // ── 1. Users (upsert) ──────────────────────────────────────────────────
  const createdUsers = {}
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10)
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        mustChangePassword: u.mustChangePassword,
      },
    })
    const key = u.role === 'ADMIN' ? 'admin' : u.name.split(' ')[0].toLowerCase()
    createdUsers[key] = user
    console.log(`  ✓ User: ${user.name} (${user.role})`)
  }

  // ── 2. Check if rich data already exists ────────────────────────────────
  const existingClient = await prisma.client.findUnique({
    where: { dotNumber: CLIENTS_RAW[0].dotNumber },
  })
  if (existingClient) {
    console.log('  ⚡ Data de clients/cases ya existe — se omite creación de datos de muestra.')
    return
  }

  // ── 3. Clients, Vehicles, Drivers ─────────────────────────────────────
  const createdClients = []
  for (const raw of CLIENTS_RAW) {
    const { _vehicles, _drivers, _vendorKey, ...clientData } = raw
    const vendor = createdUsers[_vendorKey]

    const client = await prisma.client.create({
      data: makeClient({ ...clientData, vendorId: vendor.id }),
    })
    console.log(`  ✓ Client: ${client.legalBusinessName}`)

    for (const v of _vehicles) {
      await prisma.vehicle.create({ data: { ...v, clientId: client.id } })
    }
    for (const d of _drivers) {
      await prisma.driver.create({ data: { ...d, clientId: client.id } })
    }

    createdClients.push(client)
  }

  // ── 4. Cases, StatusHistory, Policies ─────────────────────────────────
  // 2 cases per client, 10 clients → 20 cases total
  let caseIndex = 0
  for (let i = 0; i < createdClients.length; i++) {
    const client = createdClients[i]

    // Find the vendor for this client
    const rawClient = CLIENTS_RAW[i]
    const vendor = createdUsers[rawClient._vendorKey]

    for (let j = 0; j < 2; j++) {
      const plan = CASE_PLAN[caseIndex++]
      const finalStatus = plan.pipeline[plan.pipeline.length - 1]

      // Create case
      const createdCase = await prisma.case.create({
        data: {
          clientId: client.id,
          vendorId: vendor.id,
          status: finalStatus,
          notes: plan.notes || null,
          lostReason: plan.lostReason || null,
        },
      })

      // Create full status history pipeline
      for (const status of plan.pipeline) {
        await prisma.caseStatusHistory.create({
          data: {
            caseId: createdCase.id,
            status,
            note: status === plan.pipeline[0] ? 'Lead ingresado' : null,
          },
        })
      }

      // Create policy if this case reached POLICY_ISSUED
      if (finalStatus === 'POLICY_ISSUED' && plan.policy) {
        const { boundCoverages, ...policyData } = plan.policy
        await prisma.policy.create({
          data: {
            ...policyData,
            caseId: createdCase.id,
            boundCoverages: {
              create: boundCoverages,
            },
          },
        })
        console.log(`  ✓ Policy: ${plan.policy.policyNumber} → ${client.legalBusinessName}`)
      }

      console.log(`  ✓ Case [${finalStatus}]: ${client.legalBusinessName}`)
    }
  }

  console.log('\n🎉  Seed completado exitosamente.')
  console.log('\n  Credenciales:')
  console.log('  admin@premiertruckins.com    / Admin1234!')
  console.log('  maria.gonzalez@...           / Vendor1234!')
  console.log('  carlos.ruiz@...              / Vendor1234!')
  console.log('  jennifer.davis@...           / Vendor1234!')
}

main()
  .catch((err) => {
    console.error('Seed falló:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
