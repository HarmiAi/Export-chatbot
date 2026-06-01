import { useEffect, useRef } from 'react';

function QuoteModal({ isOpen, productName, onClose, onSubmit }) {
  const nameRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      nameRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultMessage = `I would like an official quotation for ${productName || 'my selected product'}.`;

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.name.value.trim(),
      company: form.company.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      message: form.message.value.trim(),
      product: productName,
    };
    onSubmit?.(data);
    form.reset();
    onClose();
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quote-modal-title">
      <div className="quote-modal__backdrop" onClick={handleBackdrop} />
      <div className="quote-modal__panel">
        <header className="quote-modal__header">
          <h2 id="quote-modal-title">Request Official Quotation</h2>
          <button type="button" className="quote-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="quote-modal__form" onSubmit={handleSubmit}>
          <label className="quote-modal__field">
            <span>Name *</span>
            <input ref={nameRef} type="text" name="name" required autoComplete="name" />
          </label>

          <label className="quote-modal__field">
            <span>Company</span>
            <input type="text" name="company" autoComplete="organization" />
          </label>

          <label className="quote-modal__field">
            <span>Email *</span>
            <input type="email" name="email" required autoComplete="email" />
          </label>

          <label className="quote-modal__field">
            <span>Phone</span>
            <input type="tel" name="phone" autoComplete="tel" />
          </label>

          <label className="quote-modal__field">
            <span>Message</span>
            <textarea name="message" rows={4} defaultValue={defaultMessage} />
          </label>

          <div className="quote-modal__actions">
            <button type="button" className="quote-modal__btn quote-modal__btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="quote-modal__btn quote-modal__btn--primary">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuoteModal;
