function PDFViewerModal({ pdfUrl, pdfTitle, pdfType, onClose }) {
  if (!pdfUrl) return null;

  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div className="pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pdf-viewer-close" onClick={onClose}>&times;</button>
        <div className="pdf-viewer-header">
          <h3>{pdfTitle}</h3>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-download-btn"
          >
            ⬇️ Descargar
          </a>
        </div>
        <div className="pdf-viewer-content">
          {pdfType === 'image' ? (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0A0A0A'
            }}>
              <img
                src={pdfUrl}
                alt={pdfTitle}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
              title={pdfTitle}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PDFViewerModal;
