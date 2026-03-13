const { Op } = require('sequelize');
const { Rider, Transaction } = require('../models');

const OUTSTANDING_TRANSACTION_STATUSES = ['pending', 'approved'];

async function getOutstandingBalanceMap(riderIds = []) {
  if (!riderIds.length) {
    return new Map();
  }

  const totals = await Transaction.findAll({
    attributes: [
      [Transaction.sequelize.col('rider_id'), 'riderId'],
      [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'balance'],
    ],
    where: {
      riderId: {
        [Op.in]: riderIds,
      },
      status: {
        [Op.in]: OUTSTANDING_TRANSACTION_STATUSES,
      },
    },
    group: [Transaction.sequelize.col('rider_id')],
    raw: true,
  });

  return new Map(
    totals.map((entry) => [
      Number(entry.riderId ?? entry.rider_id),
      Number(entry.balance || 0),
    ])
  );
}

async function syncRiderBalance(riderId) {
  const balanceMap = await getOutstandingBalanceMap([riderId]);
  const balance = balanceMap.get(Number(riderId)) || 0;

  await Rider.update(
    { currentBalance: balance },
    {
      where: { id: riderId },
    }
  );

  return balance;
}

async function syncAllRiderBalances() {
  const riders = await Rider.findAll({ attributes: ['id'], raw: true });
  const balanceMap = await getOutstandingBalanceMap(riders.map((rider) => rider.id));

  await Promise.all(
    riders.map((rider) =>
      Rider.update(
        { currentBalance: balanceMap.get(Number(rider.id)) || 0 },
        {
          where: { id: rider.id },
        }
      )
    )
  );
}

module.exports = {
  getOutstandingBalanceMap,
  syncRiderBalance,
  syncAllRiderBalances,
  OUTSTANDING_TRANSACTION_STATUSES,
};
