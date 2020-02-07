import React from "react";
import Modal from "react-modal";
import styles from "./Modal.module.css";

function ModalComponent({ type, closeModal, renderContent, height }) {
  return (
    <Modal
      isOpen={!!type}
      onRequestClose={closeModal}
      style={{
        overlay: {},
        content: { height }
      }}
      contentLabel="Example Modal"
    >
      {renderContent(type)}
      <div className={styles.buttons}>
        <button onClick={closeModal} className={styles.close}>
          Close
        </button>
      </div>
    </Modal>
  );
}

export default ModalComponent;

ModalComponent.defaultProps = {
  height: "200px"
};
