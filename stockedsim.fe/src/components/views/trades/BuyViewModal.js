import React, { useState } from 'react';
import api from '../../../helpers/api';
import { useAuth } from '../../../helpers/AuthContext';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import ConfirmationModal from '../../ConfirmationModal';

function BuyViewModal({ classesData, classId, stockSymbol, stockPrice }) {
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [purchaseAmount, setPurchaseAmount] = useState(0);

    const classData = classesData.find(cls => cls.id === classId);
    const currentBalance = classData && classData.classBalances && classData.classBalances.length > 0
        ? classData.classBalances[0].balance
        : 0;

    const maxStocks = (currentBalance / stockPrice).toFixed(2);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const setMaxAmount = () => {
        setPurchaseAmount(maxStocks);
    };

    const validateInput = () => {
        const amount = parseFloat(purchaseAmount);
        if (amount <= 0 || amount > maxStocks) {
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

            } else {

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
            <button onClick={openModal} className="truncate bg-purple-500 hover:bg-purple-700 text-md font-bold py-1 px-4 rounded-full text-white flex items-center space-x-2">
                Buy {stockSymbol} at ${stockPrice}
            </button>

            {isModalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Buy {stockSymbol}</h3>
                                <div className="mt-2">
                                    <p>Current balance for the class: ${currentBalance.toFixed(2)}</p>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            onChange={e => setPurchaseAmount(e.target.value)}
                                            value={purchaseAmount}
                                            className="border p-2 rounded-l-lg w-full"
                                            placeholder="Enter purchase amount"
                                            min=".01"
                                            max={maxStocks}
                                        />
                                        <button onClick={setMaxAmount} className="bg-gray-300 hover:bg-gray-400 text-gray-700 p-2 rounded-r-lg">
                                            MAX
                                        </button>
                                    </div>
                                    {apiError && <p className="mt-2 text-sm text-red-500">{apiError}</p>}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    className="w-full inline-flex justify-center rounded-md border border-primary shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleBuyClick}
                                >
                                    Buy
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
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
