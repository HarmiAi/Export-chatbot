const PRODUCT_RATES_USD_PER_TON = {
  'cumin seeds': { low: 2800, high: 3600 },
  'turmeric powder': { low: 2200, high: 3000 },
  'coriander seeds': { low: 2400, high: 3200 },
  ginger: { low: 1800, high: 2600 },
  lemon: { low: 900, high: 1400 },
  rice: { low: 450, high: 750 },
  default: { low: 1500, high: 2800 },
};

const FREIGHT_BY_CONTAINER = {
  LCL: { low: 450, high: 1200 },
  '20ft Container': { low: 1800, high: 4200 },
  '40ft Container': { low: 3200, high: 7800 },
};

const DOCUMENTATION = { low: 180, high: 450 };

const TRANSIT_DAYS = {
  uae: '7-12 Days',
  germany: '25-35 Days',
  usa: '30-45 Days',
  canada: '30-45 Days',
  uk: '25-35 Days',
  default: '15-40 Days',
};

export const WIZARD_PROMPTS = {
  product: `**Which product are you interested in?**

Examples:
- Cumin Seeds
- Turmeric Powder
- Coriander Seeds
- Ginger
- Lemon
- Rice`,

  quantity: `**What quantity do you need?**

Examples:
- 500 KG
- 2 Tons
- 10 Tons`,

  country: `**Which country should we export to?**

Examples:
- UAE
- USA
- Canada
- Germany
- UK`,

  packaging: `**Preferred packaging?**

Examples:
- 25 KG Bag
- 50 KG Bag
- Custom Packaging`,
};

export const QUICK_ACTION_PROMPTS = {
  shipping:
    'What are typical ocean freight transit times to UAE, USA, Canada, Germany, and UK for agricultural exports?',
  moq: 'What is MOQ?',
  countries:
    'Which countries do you export agricultural and spice products to, and what are the main requirements?',
  uae: 'Do you export to UAE?',
};

function normalizeProduct(name) {
  return (name || '').trim().toLowerCase();
}

function matchProductKey(product) {
  const n = normalizeProduct(product);
  for (const key of Object.keys(PRODUCT_RATES_USD_PER_TON)) {
    if (key !== 'default' && n.includes(key)) return key;
  }
  return 'default';
}

export function parseQuantityToTons(quantityStr) {
  const raw = (quantityStr || '').trim().toLowerCase().replace(/,/g, '');
  if (!raw) return 1;

  const tonMatch = raw.match(/([\d.]+)\s*(?:ton|tons|t\b|mt|metric\s*ton)/i);
  if (tonMatch) return Math.max(0.1, parseFloat(tonMatch[1]));

  const kgMatch = raw.match(/([\d.]+)\s*(?:kg|kgs|kilogram)/i);
  if (kgMatch) return Math.max(0.1, parseFloat(kgMatch[1]) / 1000);

  const numOnly = raw.match(/^([\d.]+)$/);
  if (numOnly) {
    const n = parseFloat(numOnly[1]);
    return n > 200 ? n / 1000 : n;
  }

  const anyNum = raw.match(/([\d.]+)/);
  if (anyNum) {
    const n = parseFloat(anyNum[1]);
    if (/kg|kilo/.test(raw)) return Math.max(0.1, n / 1000);
    if (/ton|mt/.test(raw)) return Math.max(0.1, n);
    return n > 200 ? n / 1000 : n;
  }

  return 1;
}

export function suggestContainer(tons) {
  if (tons <= 5) return 'LCL';
  if (tons <= 20) return '20ft Container';
  return '40ft Container';
}

export function getTransitEstimate(country) {
  const c = (country || '').trim().toLowerCase();
  if (c.includes('uae') || c.includes('dubai') || c.includes('emirates')) return TRANSIT_DAYS.uae;
  if (c.includes('germany') || c.includes('deutsch')) return TRANSIT_DAYS.germany;
  if (c.includes('usa') || c.includes('united states') || c.includes('america')) return TRANSIT_DAYS.usa;
  if (c.includes('canada')) return TRANSIT_DAYS.canada;
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('britain')) return TRANSIT_DAYS.uk;
  return TRANSIT_DAYS.default;
}

function formatUsdRange(low, high) {
  const fmt = (n) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  return `${fmt(low)} - ${fmt(high)}`;
}

function destinationFreightMultiplier(country) {
  const c = (country || '').toLowerCase();
  if (c.includes('uae')) return 0.85;
  if (c.includes('germany') || c.includes('uk')) return 1.15;
  if (c.includes('usa') || c.includes('canada')) return 1.35;
  return 1;
}

export function buildImportEstimate({ product, quantity, country, packaging }) {
  const tons = parseQuantityToTons(quantity);
  const productKey = matchProductKey(product);
  const rates = PRODUCT_RATES_USD_PER_TON[productKey];
  const container = suggestContainer(tons);
  const freightBase = FREIGHT_BY_CONTAINER[container];
  const destMult = destinationFreightMultiplier(country);

  const productLow = Math.round(rates.low * tons);
  const productHigh = Math.round(rates.high * tons);
  const freightLow = Math.round(freightBase.low * destMult * (container === 'LCL' ? Math.max(tons / 5, 0.4) : 1));
  const freightHigh = Math.round(freightBase.high * destMult * (container === 'LCL' ? Math.max(tons / 5, 0.6) : 1));
  const docLow = DOCUMENTATION.low;
  const docHigh = DOCUMENTATION.high;
  const totalLow = productLow + freightLow + docLow;
  const totalHigh = productHigh + freightHigh + docHigh;

  return {
    product: product.trim(),
    quantity: quantity.trim(),
    country: country.trim(),
    packaging: packaging.trim(),
    tons,
    container,
    transitTime: getTransitEstimate(country),
    productionTime: '7-15 Days',
    productCost: formatUsdRange(productLow, productHigh),
    freight: formatUsdRange(freightLow, freightHigh),
    documentation: formatUsdRange(docLow, docHigh),
    total: formatUsdRange(totalLow, totalHigh),
    disclaimer:
      'This is only an estimated calculation based on typical market ranges. Actual costs may vary. Contact us for an official quotation.',
  };
}

export function estimateToPlainText(estimate) {
  return `IMPORT COST ESTIMATE

Product: ${estimate.product}
Quantity: ${estimate.quantity}
Destination: ${estimate.country}
Packaging: ${estimate.packaging}

Estimated Product Cost: ${estimate.productCost}
Estimated Freight: ${estimate.freight}
Estimated Documentation: ${estimate.documentation}
Estimated Total: ${estimate.total}

Estimated Production Time: ${estimate.productionTime}
Estimated Transit Time: ${estimate.transitTime}
Container Suggestion: ${estimate.container}

${estimate.disclaimer}`;
}
