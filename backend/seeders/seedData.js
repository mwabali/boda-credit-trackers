const { sequelize } = require('../config/database');
const { Rider, Station, Transaction } = require('../models');

const seed = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Tables cleared and recreated');

    const riders = await Rider.bulkCreate([
      { name: 'John Mukasa', phone: '+256701234567', licensePlate: 'UAB 123X', status: 'active' },
      { name: 'Sarah Nambi', phone: '+256702345678', licensePlate: 'UCD 456Y', status: 'active' },
      { name: 'David Okello', phone: '+256703456789', licensePlate: 'UEF 789Z', status: 'active' },
      { name: 'Grace Auma', phone: '+256704567890', licensePlate: 'UGH 012A', status: 'active' },
      { name: 'Peter Ojok', phone: '+256705678901', licensePlate: 'UIJ 345B', status: 'inactive' }
    ]);
    console.log(`✅ ${riders.length} riders seeded`);

    const stations = await Station.bulkCreate([
      { name: 'Kampala Road', companyName: 'Total', location: 'Kampala Road, Central', managerName: 'Robert Kayongo', managerPhone: '+256770111001', status: 'active' },
      { name: 'Jinja Road', companyName: 'Total', location: 'Jinja Road, Nakawa', managerName: 'Mary Nantongo', managerPhone: '+256770111002', status: 'active' },
      { name: 'Bombo Road', companyName: 'Total', location: 'Bombo Road, Kawempe', managerName: 'James Ssekito', managerPhone: '+256770111003', status: 'active' },
      { name: 'Entebbe Road', companyName: 'Total', location: 'Entebbe Road, Makindye', managerName: 'Susan Kigozi', managerPhone: '+256770111004', status: 'active' }
    ]);
    console.log(`✅ ${stations.length} stations seeded`);

    const transactions = await Transaction.bulkCreate([
      { riderId: 1, stationId: 1, amount: 50000, liters: 20, status: 'paid', notes: 'Full tank payment' },
      { riderId: 2, stationId: 1, amount: 30000, liters: 12, status: 'pending', notes: 'Partial fill' },
      { riderId: 1, stationId: 2, amount: 45000, liters: 18, status: 'pending', notes: 'Emergency fuel' },
      { riderId: 3, stationId: 3, amount: 60000, liters: 24, status: 'paid', notes: 'Weekly credit cleared' },
      { riderId: 4, stationId: 2, amount: 25000, liters: 10, status: 'cancelled', notes: 'Incorrect amount' },
      { riderId: 2, stationId: 4, amount: 55000, liters: 22, status: 'pending', notes: 'Long distance trip' }
    ]);
    console.log(`✅ ${transactions.length} transactions seeded`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
