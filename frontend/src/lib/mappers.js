import {
  formatCurrency,
  formatDate,
  formatLitres,
  formatStatus,
} from './formatters'

function formatRiderId(id) {
  return `R${String(id).padStart(3, '0')}`
}

function formatStationId(id) {
  return `FS${String(id).padStart(3, '0')}`
}

function mapTransactionToRow(transaction) {
  return {
    id: transaction.id,
    rider: `${transaction.rider.name} (${formatRiderId(transaction.rider.id)})`,
    phone: transaction.rider.phone,
    number_plate: transaction.rider.licensePlate,
    station: `${transaction.station.name} (${formatStationId(transaction.station.id)})`,
    amount: formatCurrency(transaction.amount),
    litres: formatLitres(transaction.liters),
    date: formatDate(transaction.createdAt),
    status: formatStatus(transaction.status),
    statusValue: transaction.status,
  }
}

export { formatRiderId, formatStationId, mapTransactionToRow }
