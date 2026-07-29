// Universal Exchange Network (UEN) — "WAARDE LIEFDE" ruilbeurs zonder geld.
//
// Kernregel: er wordt nooit geld, valuta of een betaalmiddel uitgewisseld.
// Waarde ontstaat uit wederzijdse behoefte (Value Index), reputatie,
// beschikbaarheid en afstand. Contactgegevens worden getrapt vrijgegeven
// (niveau 1 t/m 4) naarmate een overeenkomst vordert — nooit vooraf.
//
// Dit is een echte, werkende module (geen mock): alle records worden
// persistent opgeslagen als JSON-bestanden, dezelfde stijl als de rest
// van server/ (users.json, profiles.json, ...).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data', 'exchange');
const offersFile = path.join(dataDir, 'offers.json');
const requestsFile = path.join(dataDir, 'requests.json');
const contractsFile = path.join(dataDir, 'contracts.json');
const deliveriesFile = path.join(dataDir, 'deliveries.json');
const ratingsFile = path.join(dataDir, 'ratings.json');
const exchangeProfilesFile = path.join(dataDir, 'exchange-profiles.json');

const CATEGORIES = [
  'goederen', 'diensten', 'tijd', 'kennis', 'vaardigheden',
  'productiecapaciteit', 'opslagruimte', 'transport', 'huisvesting',
  'energie', 'digitale-producten', 'software', 'media', 'kunst',
  'onderwijs', 'vrijwilligerswerk', 'onderzoek', 'sociale-ondersteuning', 'overig'
];

const DELIVERY_METHODS = [
  'persoonlijk', 'post', 'pakketdienst', 'koerier', 'afhaalpunt', 'opslaglocatie', 'derde-partij'
];

// Structural "geen geld" bewaking: deze velden mogen nooit in een payload
// voorkomen. Dit is de enige harde voorwaarde van het systeem.
const FORBIDDEN_MONEY_FIELDS = ['price', 'prijs', 'amount', 'bedrag', 'currency', 'valuta', 'paymentMethod', 'betaalmethode', 'iban', 'creditcard'];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function saveJson(filePath, data) {
  ensureDir(dataDir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function assertNoMoney(payload) {
  const found = FORBIDDEN_MONEY_FIELDS.find((key) => Object.prototype.hasOwnProperty.call(payload || {}, key));
  if (found) {
    const error = new Error(`Geld/betaalmiddelen zijn niet toegestaan in dit systeem (veld: ${found}).`);
    error.statusCode = 400;
    throw error;
  }
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function clampValueIndex(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1000, Math.round(n)));
}

function sanitizeLocation(location) {
  if (!location || typeof location !== 'object') return null;
  const lat = Number(location.lat);
  const lon = Number(location.lon);
  const label = typeof location.label === 'string' ? location.label.slice(0, 200) : '';
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
  if (!hasCoords && !label) return null;
  return { lat: hasCoords ? lat : null, lon: hasCoords ? lon : null, label };
}

function haversineKm(a, b) {
  if (!a || !b || a.lat == null || a.lon == null || b.lat == null || b.lon == null) return null;
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// --- Offers & requests -----------------------------------------------------

function createOffer(userId, payload) {
  assertNoMoney(payload);
  const title = (payload.title || '').trim();
  const category = CATEGORIES.includes(payload.category) ? payload.category : 'overig';
  if (!title) {
    const error = new Error('Titel is verplicht.');
    error.statusCode = 400;
    throw error;
  }
  const record = {
    id: newId('offer'),
    userId,
    title: title.slice(0, 200),
    category,
    description: (payload.description || '').slice(0, 2000),
    valueIndex: clampValueIndex(payload.valueIndex),
    location: sanitizeLocation(payload.location),
    status: 'open',
    createdAt: new Date().toISOString()
  };
  const offers = loadJson(offersFile, []);
  offers.push(record);
  saveJson(offersFile, offers);
  return record;
}

function createRequest(userId, payload) {
  assertNoMoney(payload);
  const title = (payload.title || '').trim();
  const category = CATEGORIES.includes(payload.category) ? payload.category : 'overig';
  if (!title) {
    const error = new Error('Titel is verplicht.');
    error.statusCode = 400;
    throw error;
  }
  const record = {
    id: newId('request'),
    userId,
    title: title.slice(0, 200),
    category,
    description: (payload.description || '').slice(0, 2000),
    valueIndex: clampValueIndex(payload.valueIndex),
    location: sanitizeLocation(payload.location),
    status: 'open',
    createdAt: new Date().toISOString()
  };
  const requests = loadJson(requestsFile, []);
  requests.push(record);
  saveJson(requestsFile, requests);
  return record;
}

function listOffers({ category, status } = {}) {
  let items = loadJson(offersFile, []);
  if (category) items = items.filter((item) => item.category === category);
  if (status) items = items.filter((item) => item.status === status);
  return items.slice().reverse();
}

function listRequests({ category, status } = {}) {
  let items = loadJson(requestsFile, []);
  if (category) items = items.filter((item) => item.category === category);
  if (status) items = items.filter((item) => item.status === status);
  return items.slice().reverse();
}

// --- AI-achtige matching engine ---------------------------------------------
// Score = categorie-overeenkomst (0.5) + waarde-index nabijheid (0.3) + afstand (0.2)

function scorePair(offer, request) {
  let score = 0;
  score += offer.category === request.category ? 0.5 : 0;
  const viDiff = Math.abs(offer.valueIndex - request.valueIndex);
  score += 0.3 * (1 - Math.min(1, viDiff / 1000));
  const distanceKm = haversineKm(offer.location, request.location);
  if (distanceKm == null) {
    score += 0.1; // onbekende afstand: neutrale bonus, geen straf
  } else {
    score += 0.2 * (1 - Math.min(1, distanceKm / 500));
  }
  return { score: Math.round(score * 1000) / 1000, distanceKm };
}

function findMatchesForUser(userId) {
  const offers = loadJson(offersFile, []).filter((o) => o.status === 'open');
  const requests = loadJson(requestsFile, []).filter((r) => r.status === 'open');

  const myOffers = offers.filter((o) => o.userId === userId);
  const myRequests = requests.filter((r) => r.userId === userId);
  const otherOffers = offers.filter((o) => o.userId !== userId);
  const otherRequests = requests.filter((r) => r.userId !== userId);

  const matches = [];
  myOffers.forEach((offer) => {
    otherRequests.forEach((request) => {
      const { score, distanceKm } = scorePair(offer, request);
      matches.push({ offer, request, score, distanceKm, direction: 'offer-to-request' });
    });
  });
  myRequests.forEach((request) => {
    otherOffers.forEach((offer) => {
      const { score, distanceKm } = scorePair(offer, request);
      matches.push({ offer, request, score, distanceKm, direction: 'request-to-offer' });
    });
  });

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 25);
}

// --- Contracten (overeenkomst zonder geld) ----------------------------------

function getOfferAndRequest(offerId, requestId) {
  const offer = loadJson(offersFile, []).find((o) => o.id === offerId);
  const request = loadJson(requestsFile, []).find((r) => r.id === requestId);
  return { offer, request };
}

function createContract(userId, payload) {
  assertNoMoney(payload);
  const { offer, request } = getOfferAndRequest(payload.offerId, payload.requestId);
  if (!offer || !request) {
    const error = new Error('Aanbieding of aanvraag niet gevonden.');
    error.statusCode = 404;
    throw error;
  }
  if (offer.userId === request.userId) {
    const error = new Error('Aanbieding en aanvraag moeten van verschillende gebruikers zijn.');
    error.statusCode = 400;
    throw error;
  }
  if (![offer.userId, request.userId].includes(userId)) {
    const error = new Error('Alleen de eigenaar van de aanbieding of aanvraag kan een overeenkomst voorstellen.');
    error.statusCode = 403;
    throw error;
  }
  if (offer.status !== 'open' || request.status !== 'open') {
    const error = new Error('Aanbieding of aanvraag is niet meer beschikbaar.');
    error.statusCode = 409;
    throw error;
  }

  const record = {
    id: newId('contract'),
    offerId: offer.id,
    requestId: request.id,
    participants: [offer.userId, request.userId],
    proposedBy: userId,
    terms: (payload.terms || '').slice(0, 2000),
    status: 'proposed', // proposed -> accepted -> delivery-scheduled -> completed | cancelled
    delivery: null,
    confirmations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const contracts = loadJson(contractsFile, []);
  contracts.push(record);
  saveJson(contractsFile, contracts);

  const offers = loadJson(offersFile, []).map((o) => (o.id === offer.id ? { ...o, status: 'matched' } : o));
  saveJson(offersFile, offers);
  const requests = loadJson(requestsFile, []).map((r) => (r.id === request.id ? { ...r, status: 'matched' } : r));
  saveJson(requestsFile, requests);

  return record;
}

function requireParticipant(contract, userId) {
  if (!contract.participants.includes(userId)) {
    const error = new Error('Je bent geen deelnemer aan deze overeenkomst.');
    error.statusCode = 403;
    throw error;
  }
}

function getContract(contractId) {
  const contract = loadJson(contractsFile, []).find((c) => c.id === contractId);
  if (!contract) {
    const error = new Error('Overeenkomst niet gevonden.');
    error.statusCode = 404;
    throw error;
  }
  return contract;
}

function updateContract(contractId, mutator) {
  const contracts = loadJson(contractsFile, []);
  const index = contracts.findIndex((c) => c.id === contractId);
  if (index === -1) {
    const error = new Error('Overeenkomst niet gevonden.');
    error.statusCode = 404;
    throw error;
  }
  const updated = mutator({ ...contracts[index] });
  updated.updatedAt = new Date().toISOString();
  contracts[index] = updated;
  saveJson(contractsFile, contracts);
  return updated;
}

function acceptContract(userId, contractId) {
  const contract = getContract(contractId);
  requireParticipant(contract, userId);
  if (contract.status !== 'proposed') {
    const error = new Error('Overeenkomst kan niet meer worden geaccepteerd in deze status.');
    error.statusCode = 409;
    throw error;
  }
  if (contract.proposedBy === userId) {
    const error = new Error('Wacht tot de andere partij de overeenkomst accepteert.');
    error.statusCode = 409;
    throw error;
  }
  return updateContract(contractId, (c) => ({ ...c, status: 'accepted' }));
}

function scheduleDelivery(userId, contractId, payload) {
  assertNoMoney(payload);
  const contract = getContract(contractId);
  requireParticipant(contract, userId);
  if (contract.status !== 'accepted') {
    const error = new Error('Overeenkomst moet eerst geaccepteerd zijn.');
    error.statusCode = 409;
    throw error;
  }
  const method = DELIVERY_METHODS.includes(payload.method) ? payload.method : null;
  if (!method) {
    const error = new Error(`Ongeldige leveringsmethode. Kies uit: ${DELIVERY_METHODS.join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }
  const meetingPoint = method === 'persoonlijk' ? sanitizeLocation(payload.meetingPoint) : null;
  if (method === 'persoonlijk' && !meetingPoint) {
    const error = new Error('Voor een persoonlijke ontmoeting is een geolocatie/afspraakpunt verplicht.');
    error.statusCode = 400;
    throw error;
  }

  const delivery = {
    id: newId('delivery'),
    contractId,
    method,
    meetingPoint,
    timeslot: (payload.timeslot || '').slice(0, 200),
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };
  const deliveries = loadJson(deliveriesFile, []);
  deliveries.push(delivery);
  saveJson(deliveriesFile, deliveries);

  return updateContract(contractId, (c) => ({ ...c, status: 'delivery-scheduled', delivery: { id: delivery.id, method, timeslot: delivery.timeslot } }));
}

function confirmCompletion(userId, contractId) {
  const contract = getContract(contractId);
  requireParticipant(contract, userId);
  if (contract.status !== 'delivery-scheduled' && contract.status !== 'completed') {
    const error = new Error('Levering moet eerst gepland zijn.');
    error.statusCode = 409;
    throw error;
  }
  const confirmations = Array.from(new Set([...(contract.confirmations || []), userId]));
  const bothConfirmed = contract.participants.every((p) => confirmations.includes(p));
  const status = bothConfirmed ? 'completed' : contract.status;

  if (bothConfirmed) {
    const deliveries = loadJson(deliveriesFile, []).map((d) => (d.id === (contract.delivery && contract.delivery.id) ? { ...d, status: 'completed' } : d));
    saveJson(deliveriesFile, deliveries);
    const offers = loadJson(offersFile, []).map((o) => (o.id === contract.offerId ? { ...o, status: 'closed' } : o));
    saveJson(offersFile, offers);
    const requests = loadJson(requestsFile, []).map((r) => (r.id === contract.requestId ? { ...r, status: 'closed' } : r));
    saveJson(requestsFile, requests);
  }

  return updateContract(contractId, (c) => ({ ...c, confirmations, status }));
}

function cancelContract(userId, contractId) {
  const contract = getContract(contractId);
  requireParticipant(contract, userId);
  if (['completed', 'cancelled'].includes(contract.status)) {
    const error = new Error('Overeenkomst kan niet meer geannuleerd worden.');
    error.statusCode = 409;
    throw error;
  }
  const offers = loadJson(offersFile, []).map((o) => (o.id === contract.offerId ? { ...o, status: 'open' } : o));
  saveJson(offersFile, offers);
  const requests = loadJson(requestsFile, []).map((r) => (r.id === contract.requestId ? { ...r, status: 'open' } : r));
  saveJson(requestsFile, requests);
  return updateContract(contractId, (c) => ({ ...c, status: 'cancelled' }));
}

function listContractsForUser(userId) {
  return loadJson(contractsFile, []).filter((c) => c.participants.includes(userId)).slice().reverse();
}

// --- Getrapte contactvrijgave (niveau 1–4) ----------------------------------
// Niveau 1 (publiek): gebruikersnaam — altijd zichtbaar via aanbiedingen/aanvragen.
// Niveau 2 (na match): e-mail + telefoon — zodra een overeenkomst is voorgesteld.
// Niveau 3 (na overeenkomst): postadres/afleveradres — zodra beide akkoord zijn.
// Niveau 4 (fysieke ontmoeting): geolocatie + tijdslot — zodra "persoonlijk" gepland is.

function contactTierForContract(contract) {
  if (!contract || contract.status === 'cancelled') return 0;
  let tier = 1;
  if (['proposed', 'accepted', 'delivery-scheduled', 'completed'].includes(contract.status)) tier = 2;
  if (['accepted', 'delivery-scheduled', 'completed'].includes(contract.status)) tier = 3;
  if (['delivery-scheduled', 'completed'].includes(contract.status) && contract.delivery && contract.delivery.method === 'persoonlijk') tier = 4;
  return tier;
}

function getCounterpartContact(userId, contractId, resolveUser) {
  const contract = getContract(contractId);
  requireParticipant(contract, userId);
  const counterpartId = contract.participants.find((p) => p !== userId);
  const tier = contactTierForContract(contract);
  const profiles = loadJson(exchangeProfilesFile, []);
  const profile = profiles.find((p) => p.userId === counterpartId) || {};
  const counterpartUser = resolveUser ? resolveUser(counterpartId) : null;

  const result = {
    tier,
    contractStatus: contract.status,
    user: { id: counterpartId, name: counterpartUser ? counterpartUser.name : counterpartId }
  };
  if (tier >= 2) {
    result.contactEmail = profile.contactEmail || null;
    result.contactPhone = profile.contactPhone || null;
  }
  if (tier >= 3) {
    result.postAddress = profile.postAddress || null;
  }
  if (tier >= 4) {
    const deliveries = loadJson(deliveriesFile, []);
    const delivery = deliveries.find((d) => d.id === (contract.delivery && contract.delivery.id));
    result.meetingPoint = delivery ? delivery.meetingPoint : null;
    result.timeslot = delivery ? delivery.timeslot : null;
  }
  return result;
}

function saveExchangeProfile(userId, payload) {
  assertNoMoney(payload);
  const profiles = loadJson(exchangeProfilesFile, []);
  const index = profiles.findIndex((p) => p.userId === userId);
  const record = {
    userId,
    contactEmail: typeof payload.contactEmail === 'string' ? payload.contactEmail.slice(0, 200) : (index >= 0 ? profiles[index].contactEmail : ''),
    contactPhone: typeof payload.contactPhone === 'string' ? payload.contactPhone.slice(0, 60) : (index >= 0 ? profiles[index].contactPhone : ''),
    postAddress: typeof payload.postAddress === 'string' ? payload.postAddress.slice(0, 400) : (index >= 0 ? profiles[index].postAddress : ''),
    updatedAt: new Date().toISOString()
  };
  if (index >= 0) {
    profiles[index] = record;
  } else {
    profiles.push(record);
  }
  saveJson(exchangeProfilesFile, profiles);
  return record;
}

function getExchangeProfile(userId) {
  const profiles = loadJson(exchangeProfilesFile, []);
  return profiles.find((p) => p.userId === userId) || { userId, contactEmail: '', contactPhone: '', postAddress: '' };
}

// --- Reputatie (uit ratings, geen geld) -------------------------------------

function submitRating(userId, payload) {
  const contract = getContract(payload.contractId);
  requireParticipant(contract, userId);
  if (contract.status !== 'completed') {
    const error = new Error('Beoordelen kan pas nadat de uitwisseling is voltooid.');
    error.statusCode = 409;
    throw error;
  }
  const ratings = loadJson(ratingsFile, []);
  if (ratings.some((r) => r.contractId === contract.id && r.raterId === userId)) {
    const error = new Error('Je hebt deze overeenkomst al beoordeeld.');
    error.statusCode = 409;
    throw error;
  }
  const targetId = contract.participants.find((p) => p !== userId);
  const score = Math.max(1, Math.min(5, Number(payload.score) || 0));
  const record = {
    id: newId('rating'),
    contractId: contract.id,
    raterId: userId,
    targetId,
    score,
    comment: (payload.comment || '').slice(0, 500),
    createdAt: new Date().toISOString()
  };
  ratings.push(record);
  saveJson(ratingsFile, ratings);
  return record;
}

function getReputation(targetUserId) {
  const ratings = loadJson(ratingsFile, []).filter((r) => r.targetId === targetUserId);
  const count = ratings.length;
  const average = count ? ratings.reduce((sum, r) => sum + r.score, 0) / count : null;
  return { userId: targetUserId, reputationScore: average ? Math.round(average * 100) / 100 : null, ratingCount: count };
}

module.exports = {
  CATEGORIES,
  DELIVERY_METHODS,
  createOffer,
  createRequest,
  listOffers,
  listRequests,
  findMatchesForUser,
  createContract,
  acceptContract,
  scheduleDelivery,
  confirmCompletion,
  cancelContract,
  listContractsForUser,
  getContract,
  contactTierForContract,
  getCounterpartContact,
  saveExchangeProfile,
  getExchangeProfile,
  submitRating,
  getReputation
};
