import React from "react";

interface CongratsModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  score: number;
}

const CongratsModal: React.FC<CongratsModalProps> = ({ isOpen, setIsOpen, score }) => {
  console.log(isOpen)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-pink-100 rounded-lg p-6 w-80 shadow-lg text-center">
        <h2 className="text-3xl font-bold text-purple-800">🎉 Yo Hoooo! 🎉</h2>
        <p className="text-lg text-pink-600 mt-3">You have scored:</p>
        <p className="text-2xl font-bold text-violet-400 mt-2">{score}</p>

        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full mt-4"
          onClick={() => setIsOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CongratsModal;
