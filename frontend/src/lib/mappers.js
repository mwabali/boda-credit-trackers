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

function getStationDisplayName(station = {}) {
  if (!station) {
    return ''
  }

  return (
    station.displayName ||
    [station.companyName || station.company_name, station.name].filter(Boolean).join(' ')
  )
}

function getTransactionTimestamp(transaction) {
  return transaction.createdAt || transaction.created_at || transaction.updatedAt || transaction.updated_at
}

function mapTransactionToRow(transaction) {
  return {
    id: transaction.id,
    rider: `${transaction.rider.name} (${formatRiderId(transaction.rider.id)})`,
    phone: transaction.rider.phone,
    number_plate: transaction.rider.licensePlate,
    station: `${getStationDisplayName(transaction.station)} (${formatStationId(transaction.station.id)})`,
    amount: formatCurrency(transaction.amount),
    litres: formatLitres(transaction.liters),
    date: formatDate(getTransactionTimestamp(transaction)),
    status: formatStatus(transaction.status),
    statusValue: transaction.status,
  }
}

export {
  formatRiderId,
  formatStationId,
  getStationDisplayName,
  getTransactionTimestamp,
  mapTransactionToRow,
}
