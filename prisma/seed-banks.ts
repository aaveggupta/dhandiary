import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-seeded banks for India and US
const BANKS = [
  // India - Public Sector Banks
  { name: 'State Bank of India', country: 'IN' },
  { name: 'Punjab National Bank', country: 'IN' },
  { name: 'Bank of Baroda', country: 'IN' },
  { name: 'Canara Bank', country: 'IN' },
  { name: 'Union Bank of India', country: 'IN' },
  { name: 'Bank of India', country: 'IN' },
  { name: 'Indian Bank', country: 'IN' },
  { name: 'Central Bank of India', country: 'IN' },
  { name: 'Indian Overseas Bank', country: 'IN' },
  { name: 'UCO Bank', country: 'IN' },
  { name: 'Bank of Maharashtra', country: 'IN' },
  { name: 'Punjab & Sind Bank', country: 'IN' },
  
  // India - Private Sector Banks
  { name: 'HDFC Bank', country: 'IN' },
  { name: 'ICICI Bank', country: 'IN' },
  { name: 'Axis Bank', country: 'IN' },
  { name: 'Kotak Mahindra Bank', country: 'IN' },
  { name: 'IndusInd Bank', country: 'IN' },
  { name: 'Yes Bank', country: 'IN' },
  { name: 'IDFC First Bank', country: 'IN' },
  { name: 'Federal Bank', country: 'IN' },
  { name: 'RBL Bank', country: 'IN' },
  { name: 'South Indian Bank', country: 'IN' },
  { name: 'Karur Vysya Bank', country: 'IN' },
  { name: 'City Union Bank', country: 'IN' },
  { name: 'Tamilnad Mercantile Bank', country: 'IN' },
  { name: 'DCB Bank', country: 'IN' },
  { name: 'Bandhan Bank', country: 'IN' },
  { name: 'AU Small Finance Bank', country: 'IN' },
  { name: 'Ujjivan Small Finance Bank', country: 'IN' },
  { name: 'Equitas Small Finance Bank', country: 'IN' },
  
  // India - Payment Banks & Fintech
  { name: 'Paytm Payments Bank', country: 'IN' },
  { name: 'Airtel Payments Bank', country: 'IN' },
  { name: 'India Post Payments Bank', country: 'IN' },
  { name: 'Fino Payments Bank', country: 'IN' },
  { name: 'Jio Payments Bank', country: 'IN' },
  { name: 'NSDL Payments Bank', country: 'IN' },
  { name: 'Fi Money', country: 'IN' },
  { name: 'Jupiter', country: 'IN' },
  { name: 'Niyo', country: 'IN' },
  { name: 'Slice', country: 'IN' },
  { name: 'OneCard', country: 'IN' },
  
  // India - Foreign Banks in India
  { name: 'Citibank India', country: 'IN' },
  { name: 'HSBC India', country: 'IN' },
  { name: 'Standard Chartered India', country: 'IN' },
  { name: 'Deutsche Bank India', country: 'IN' },
  { name: 'DBS Bank India', country: 'IN' },
  
  // USA - Major National Banks
  { name: 'JPMorgan Chase', country: 'US' },
  { name: 'Bank of America', country: 'US' },
  { name: 'Wells Fargo', country: 'US' },
  { name: 'Citibank', country: 'US' },
  { name: 'U.S. Bank', country: 'US' },
  { name: 'PNC Bank', country: 'US' },
  { name: 'Truist', country: 'US' },
  { name: 'Goldman Sachs', country: 'US' },
  { name: 'TD Bank', country: 'US' },
  { name: 'Capital One', country: 'US' },
  { name: 'Charles Schwab', country: 'US' },
  { name: 'HSBC USA', country: 'US' },
  { name: 'BMO Harris Bank', country: 'US' },
  { name: 'Fifth Third Bank', country: 'US' },
  { name: 'KeyBank', country: 'US' },
  { name: 'Huntington Bank', country: 'US' },
  { name: 'M&T Bank', country: 'US' },
  { name: 'Regions Bank', country: 'US' },
  { name: 'Citizens Bank', country: 'US' },
  { name: 'First Republic Bank', country: 'US' },
  
  // USA - Credit Card Issuers
  { name: 'American Express', country: 'US' },
  { name: 'Discover', country: 'US' },
  { name: 'Synchrony Bank', country: 'US' },
  { name: 'Barclays US', country: 'US' },
  
  // USA - Online Banks & Fintech
  { name: 'Ally Bank', country: 'US' },
  { name: 'Marcus by Goldman Sachs', country: 'US' },
  { name: 'Chime', country: 'US' },
  { name: 'SoFi', country: 'US' },
  { name: 'Varo Bank', country: 'US' },
  { name: 'Current', country: 'US' },
  { name: 'Aspiration', country: 'US' },
  { name: 'Simple', country: 'US' },
  { name: 'N26', country: 'US' },
  { name: 'Revolut', country: 'US' },
  
  // USA - Credit Unions (Major)
  { name: 'Navy Federal Credit Union', country: 'US' },
  { name: 'Pentagon Federal Credit Union', country: 'US' },
  { name: 'State Employees Credit Union', country: 'US' },
  { name: 'SchoolsFirst Federal Credit Union', country: 'US' },
  
  // Global
  { name: 'Other', country: 'GLOBAL' },
];

async function seedBanks() {
  console.log('Seeding banks...');
  
  let created = 0;
  let skipped = 0;
  
  for (const bank of BANKS) {
    const existing = await prisma.bank.findUnique({
      where: { name: bank.name },
    });
    
    if (!existing) {
      await prisma.bank.create({
        data: {
          name: bank.name,
          country: bank.country,
          isSystem: true,
        },
      });
      created++;
    } else {
      skipped++;
    }
  }
  
  console.log(`✓ Banks seeded: ${created} created, ${skipped} already existed`);
}

seedBanks()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
