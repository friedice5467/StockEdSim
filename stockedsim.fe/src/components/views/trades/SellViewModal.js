import React, { useState } from 'react';
import api from '../../../helpers/api';
import { useAuth } from '../../../helpers/AuthContext';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import ConfirmationModal from '../../ConfirmationModal';
import CurrencyInput from '../../../helpers/CurrencyInput';

function SellViewModal({ isModalOpen, openModal, closeModal, classesData, classId, stockSymbol, stockPrice }) {
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [isCurrency, setIsCurrency] = useState(true);

    const classData = classesData.find(cls => cls.id === classId);
    const stocksOfInterest = classData.stocks.filter(stock => stock.stockSymbol === stockSymbol);

    const totalCost = stocksOfInterest.reduce((accum, stock) => accum + (stock.amount * stockPrice), 0);
    const totalAmount = stocksOfInterest.reduce((accum, stock) => accum + stock.amount, 0);

    const toggleConversion = (isConverter) => {
        if (isCurrency) {
            const amountInStocks = (parseFloat(amount) / stockPrice).toFixed(2);
            setAmount(amountInStocks);
        } else {
            const amountInCurrency = (parseFloat(amount) * stockPrice).toFixed(2);
            setAmount(amountInCurrency);
        }
        if (isConverter) {
            setIsCurrency(!isCurrency);
        }
    };

    const updateExpectedBalance = (value) => {
        if (value) {
            const numericValue = parseFloat(value.replace('$', '').replace(/,/g, ''));
            setAmount(numericValue);
        } else {
            setAmount('');
        }
    }

    const validateInput = () => {
        const numericAmount = parseFloat(amount);
        if (numericAmount <= 0 || (isCurrency && numericAmount > totalAmount) || (!isCurrency && numericAmount * stockPrice > totalCost)) {
            return { valid: false, error: "Invalid sell amount." };
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
            Amount: isCurrency ? parseFloat(amount) / stockPrice : parseFloat(amount),
            StudentId: currentUser.userId,
            ClassId: classId
        };

        try {
            cawait api.post(`/market/sell/${classId}`, stockPurchaseData);
        } catch (error) {
            console.error("Error selling stock:", error);
            if (error.response && error.response.data) {
                setApiError(error.response.data);
            } else {
                setApiError("Error selling stock.");
            }
        } finally {
            setIsLoading(false);
        }

        closeModal();
    };

    return (
        <div>
            {isModalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Sell {stockSymbol} at ${stockPrice}</h3>
                                <div className="mt-2">
                                    <p>Current owned value for {stockSymbol}: ${totalCost.toFixed(2)}</p>
                                    <p>Current owned amount of {stockSymbol}: {totalAmount.toFixed(2)}</p>
                                    <div className="flex">
                                        <button onClick={() => toggleConversion(true)} className="bg-gray-300 hover:bg-gray-400 text-gray-700 p-2 rounded-l-lg">
                                            Convert to {isCurrency ? stockSymbol : "$"}
                                        </button>
                                        {isCurrency ? (
                                            <CurrencyInput
                                                placeholder={`Enter amount in $ to sell`}
                                                value={amount}
                                                onChange={e => updateExpectedBalance(e.target.value)}
                                                className="border p-2 w-full"
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                placeholder={`Enter amount in ${stockSymbol}`}
                                                value={amount}
                                                onChange={e => updateExpectedBalance(e.target.value)}
                                                className="border p-2 w-full"
                                            />
                                        )}
                                    </div>
                                    {apiError && <p className="mt-2 text-sm text-red-500">{apiError}</p>}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={closeModal}
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="w-full inline-flex justify-center rounded-md border border-primary shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mr-3 sm:w-auto sm:text-sm"
                                    onClick={handleBuyClick}
                                >
                                    Sell
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

export default SellViewModal;
