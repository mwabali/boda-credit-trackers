const DEFAULT_COMPANY_NAME = 'Total';
const LEGACY_COMPANY_PREFIXES = ['Total', 'Shell', 'Gapco', 'City Oil'];

function normalizeStationBranchName(name = '') {
  const trimmedName = String(name || '').trim();

  if (!trimmedName) {
    return '';
  }

  const matchingPrefix = LEGACY_COMPANY_PREFIXES.find((prefix) =>
    trimmedName.toLowerCase().startsWith(`${prefix.toLowerCase()} `)
  );

  if (!matchingPrefix) {
    return trimmedName;
  }

  return trimmedName.slice(matchingPrefix.length).trim();
}

function getStationCompanyName(station = {}) {
  return station.companyName || DEFAULT_COMPANY_NAME;
}

function getStationDisplayName(station = {}) {
  const companyName = getStationCompanyName(station);
  const branchName = normalizeStationBranchName(station.name);

  return branchName ? `${companyName} ${branchName}` : companyName;
}

function hydrateStation(station) {
  const stationData =
    typeof station?.toJSON === 'function' ? station.toJSON() : { ...(station || {}) };

  return {
    ...stationData,
    name: normalizeStationBranchName(stationData.name),
    companyName: getStationCompanyName(stationData),
    displayName: getStationDisplayName(stationData),
  };
}

function prepareStationPayload(payload = {}) {
  return {
    ...payload,
    name: normalizeStationBranchName(payload.name),
    companyName: payload.companyName || DEFAULT_COMPANY_NAME,
  };
}

module.exports = {
  DEFAULT_COMPANY_NAME,
  getStationDisplayName,
  hydrateStation,
  normalizeStationBranchName,
  prepareStationPayload,
};
