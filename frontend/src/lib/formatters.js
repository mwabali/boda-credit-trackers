function formatCurrency(value) {
  const amount = Number(value || 0)

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatLitres(value) {
  if (value === null || value === undefined || value === '') {
    return '--'
  }

  return `${Number(value)}L`
}

function formatDate(value) {
  if (!value) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatStatus(value) {
  if (!value) {
    return 'Unknown'
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

export { formatCurrency, formatDate, formatLitres, formatStatus }
