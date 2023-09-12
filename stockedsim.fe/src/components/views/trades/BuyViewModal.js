import React, { useState } from 'react';
import api from '../../../helpers/api';
import { useAuth } from '../../../helpers/AuthContext';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import ConfirmationModal from '../../ConfirmationModal'; 

function BuyViewModal({ classesData, classId, stockSymbol }) {
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [purchaseAmount, setPurchaseAmount] = useState(0);
    const currentBalance = classesData.find(cls => cls.id === classId)?.DefaultBalance || 0;

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const validateInput = () => {
        const amount = parseFloat(purchaseAmount);
        if (amount <= 0 || amount > currentBalance) {
            return { valid: false, error: "Invalid purchase amount." };
        }
        if (!stockSymbol) {
            return { valid: false, error: "Select a stock symbol." };
        }
        return { valid: true, error: null };
    };

    const handleBuyClick = () => {
        const validationResult = validateInput();
        if (!validationResult.valid) {
            setApiError(validationResult.error);
            return;
        }
        setIsConfirmOpen(true);
    };

    const confirmPurchase = async () => {
        setIsConfirmOpen(false);
        setIsLoading(true);

        const stockPurchaseData = {
            StockSymbol: stockSymbol,
            Amount: parseFloat(purchaseAmount),
            StudentId: currentUser.userId
    };

        try {
            const response = await api.post(`/market/buy/${classId}`, stockPurchaseData);
            if (response.status === 200) {
                // Handle the successful purchase, maybe show a notification or refresh some data
            } else {
                // Handle any other non-error HTTP status codes if necessary
            }
        } catch (error) {
            console.error("Error purchasing stock:", error);
            if (error.response && error.response.data) {
                setApiError(error.response.data);
            } else {
                setApiError("Error purchasing stock.");
            }
        } finally {
            setIsLoading(false);
        }

        closeModal();
    };


    return (
        <div>
            <button onClick={openModal}>Buy</button>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span onClick={closeModal}>X</span>
                        <h2>Buy Stocks</h2>
                        <p>Current balance for the class: ${currentBalance}</p>
                        <input
                            type="number"
                            onChange={e => setPurchaseAmount(e.target.value)}
                            className="border p-2 rounded-lg w-full mb-2"
                            placeholder="Enter purchase amount"
                            min=".01"
                            max={currentBalance}
                        />
                        <button
                            className="bg-blue-600 text-white mt-4 px-4 py-2 rounded-lg w-full"
                            onClick={handleBuyClick}
                        >
                            Buy
                        </button>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmPurchase}
                message="Are you sure you want to make this purchase?"
            />

            {isLoading && <LoadingModal />}
            {apiError && <ApiExceptionModal error={apiError} onClose={() => setApiError(null)} />}
        </div>
    );
}

export default BuyViewModal;
