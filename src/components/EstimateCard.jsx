function EstimateCard({ estimate, onRequestQuote }) {
  if (!estimate) return null;

  return (
    <div className="estimate-card">
      <div className="estimate-card__glow" aria-hidden="true" />
      <div className="estimate-card__inner">
        <header className="estimate-card__header">
          <span className="estimate-card__badge">Export Estimate</span>
          <h3 className="estimate-card__title">Import Cost Estimate</h3>
          <p className="estimate-card__subtitle">Indicative pricing — not a binding quote</p>
        </header>

        <div className="estimate-card__divider" />

        <dl className="estimate-card__grid">
          <div className="estimate-card__row">
            <dt>Product</dt>
            <dd>{estimate.product}</dd>
          </div>
          <div className="estimate-card__row">
            <dt>Quantity</dt>
            <dd>{estimate.quantity}</dd>
          </div>
          <div className="estimate-card__row">
            <dt>Destination</dt>
            <dd>{estimate.country}</dd>
          </div>
          <div className="estimate-card__row">
            <dt>Packaging</dt>
            <dd>{estimate.packaging}</dd>
          </div>
        </dl>

        <div className="estimate-card__divider" />

        <dl className="estimate-card__costs">
          <div className="estimate-card__cost">
            <dt>Estimated Product Cost</dt>
            <dd>{estimate.productCost}</dd>
          </div>
          <div className="estimate-card__cost">
            <dt>Estimated Freight</dt>
            <dd>{estimate.freight}</dd>
          </div>
          <div className="estimate-card__cost">
            <dt>Estimated Documentation</dt>
            <dd>{estimate.documentation}</dd>
          </div>
          <div className="estimate-card__cost estimate-card__cost--total">
            <dt>Estimated Total</dt>
            <dd>{estimate.total}</dd>
          </div>
        </dl>

        <div className="estimate-card__divider" />

        <dl className="estimate-card__meta">
          <div className="estimate-card__meta-item">
            <dt>Production Time</dt>
            <dd>{estimate.productionTime}</dd>
          </div>
          <div className="estimate-card__meta-item">
            <dt>Transit Time</dt>
            <dd>{estimate.transitTime}</dd>
          </div>
          <div className="estimate-card__meta-item">
            <dt>Container Suggestion</dt>
            <dd>{estimate.container}</dd>
          </div>
        </dl>

        <p className="estimate-card__disclaimer">{estimate.disclaimer}</p>

        <button
          type="button"
          className="estimate-card__cta"
          onClick={() => onRequestQuote?.(estimate.product)}
        >
          📩 Request Official Quotation
        </button>
      </div>
    </div>
  );
}

export default EstimateCard;
