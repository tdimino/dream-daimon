import React, { useEffect, useRef } from 'react';

interface DreamLogOverlayProps {
  message: string;
  onClose: () => void;
}

const DreamLogOverlay: React.FC<DreamLogOverlayProps> = ({ message, onClose }) => {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const messageElement = messageRef.current;
    if (messageElement) {
      const children = messageElement.children;
      for (let i = 0; i < children.length; i++) {
        observer.observe(children[i]);
      }
    }

    return () => {
      if (messageElement) {
        const children = messageElement.children;
        for (let i = 0; i < children.length; i++) {
          observer.unobserve(children[i]);
        }
      }
    };
  }, []);

  const formattedMessage = message.split('\n').map((line, index) => {
    const isSceneLine = line.startsWith('Scene');
    return (
      <div key={index} className="fade-in">
        {isSceneLine ? <strong>{line}</strong> : line}
      </div>
    );
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="dream-overlay-content p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
        <h2 className="dream-overlay-heading text-2xl font-bold mb-4">Dream Log</h2>
        <div className="dream-overlay-message mb-6" ref={messageRef}>
          {formattedMessage}
        </div>
        <button
          onClick={onClose}
          className="dream-overlay-button bg-tyrian-purple text-white px-6 py-3 rounded-lg text-lg font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DreamLogOverlay;