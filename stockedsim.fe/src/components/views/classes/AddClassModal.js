import React, { useState } from 'react';
import CurrencyInput from '../../../helpers/CurrencyInput';

const AddClassModal = ({ onClose, onCreate }) => {
    const [className, setClassName] = useState('');
    const [defaultValue, setDefaultValue] = useState(20000);
    const [error, setError] = useState(null);

    const handleSubmit = () => {
        if (className.trim() === '') {
            setError('Class name is required');
            return;
        }
        if (!defaultValue || defaultValue < 0) {
            setError('A value is required and must be greater than 0');
            return;
        }

        setError(null);
        onCreate(className, defaultValue);
    };

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Class</h3>
                        <div className="mt-2">
                            <input
                                type="text"
                                placeholder="Enter class name"
                                value={className}
                                onChange={e => setClassName(e.target.value)}
                                className="border p-2 rounded w-full"
                            />
                            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                        </div>
                        <div className="mt-2">
                            <CurrencyInput
                                placeholder="Enter a starting balance for students"
                                value={defaultValue}
                                onChange={e => setDefaultValue(e.target.value)}
                                className="border p-2 rounded w-full"
                            >
                            </CurrencyInput>
                            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button onClick={handleSubmit} className="w-full inline-flex justify-center rounded-md border border-primary shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                            Create
                        </button>
                        <button onClick={onClose} type="button" className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddClassModal;
