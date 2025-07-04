import { createPortal } from 'preact/compat';
import './Modal.css';

export const Modal = ({ onClose, children, title }) => { // children is a special property and represents what's passed inside the <Modal>
  const handleCloseClick = (e) => {
    e.preventDefault();
    onClose();
  };

  const modalContent = (
    <div className="modal-overlay">
      {/* Wrap the whole Modal inside the newly created StyledModalWrapper and use the ref */}
      <div className="modal-wrapper">
        <div className="modal">
          <div className="modal-header">
            <a href="#" onClick={handleCloseClick}>
              x
            </a>
          </div>
          {title && <h1>{title}</h1>}
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    modalContent,
    document.getElementById("modal-root")
  );
};
