import React, { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

function TransactionGrid({ transactions }) {
    const columnDefs = [
        {
            headerName: "Transaction Date",
            field: "transactionDate",
            sortable: true,
            sort: 'desc',
            valueFormatter: params => new Date(params.value).toLocaleString()
        },
        {
            headerName: "Stock Symbol",
            field: "stockSymbol",
            sortable: true
        },
        {
            headerName: "Price At Transaction",
            field: "priceAtTransaction",
            valueFormatter: params => `$${params.value.toFixed(2)}`
        },
        {
            headerName: "Transaction Type",
            field: "type",
            valueGetter: params => params.data.type === 0 ? "Buy" : "Sell"
        },
        {
            headerName: "Profit",
            field: "netProfit",
            sortable: true,
            cellStyle: params => ({
                color: params.value > 0 ? 'green' : 'red'
            }),
            valueFormatter: params => {
                if (params.value == null) {
                    return '';
                }
                else if (params.value > 0) {
                    return `+$${params.value.toFixed(2)}`;
                } else if (params.value <= 0) {
                    return `-$${Math.abs(params.value).toFixed(2)}`;
                }
            }
        },
        {
            headerName: "Amount",
            field: "amount",
            valueFormatter: params => `${params.value.toFixed(2)}`
        }
    ];

    return (
        <div className="ag-theme-alpine" style={{ height: 'calc(100% - 1rem)', width: '100%' }}>
            <AgGridReact
                columnDefs={columnDefs}
                rowData={transactions}
                domLayout='autoHeight'
                defaultColDef={{ resizable: true }}
            />
        </div>
    );
}

function PortfolioView({ updateClasses }) {
    const [classes, setClasses] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [stockQuotes, setStockQuotes] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiException, setApiException] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            try {
                const response = await api.get("/market/myprofile/dashboard");
                const classesData = response.data;
                setClasses(classesData);
                updateClasses(classesData);

                if (classesData && classesData.length === 1) {
                    const defaultClass = classesData[0];
                    setSelectedClass(defaultClass);
                    fetchStockQuotes(defaultClass);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setApiException(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [updateClasses]);

    const fetchStockQuotes = async (selectedClass) => {
        const symbols = selectedClass.stocks.map(s => s.stockSymbol).join(',');

        try {
            setIsLoading(true);
            const response = await api.get(`/market/bulkQuote/${symbols}`);
            const quotesDict = {};

            response.data.forEach(quote => {
                quotesDict[quote.symbol] = quote;
            });

            setStockQuotes(quotesDict);
        } catch (error) {
            console.error("Error fetching stock quotes:", error);
            setApiException(error);
        } finally {
            setIsLoading(false);
        }
    }


    const handleClassChange = (event) => {
        const classId = event.target.value;
        const selected = classes.find(c => c.id === classId);
        setSelectedClass(selected);
        fetchStockQuotes(selected);
    };

    let totalStockValue = 0;
    if (selectedClass) {
        totalStockValue = selectedClass.stocks.reduce((sum, stock) => {
            const stockQuote = stockQuotes[stock.stockSymbol] || {};
            return sum + stock.amount * (stockQuote.price || 0);
        }, 0);
    }

    return (
        <div className="flex flex-col items-center h-full w-full text-black" style={{ boxSizing: 'border-box' }}>
            <div className="w-4/6 mb-4 px-4">

                {classes && (
                    <div className="my-2">
                        <p className="text-center text-xl font-bold mt-4">{selectedClass.className} - Available Spending Balance: ${selectedClass.classBalances[0].balance}</p>
                        <label htmlFor="classDropdown" className="mr-2 font-bold">Select Class:</label>
                        <select id="classDropdown" value={selectedClass ? selectedClass.id : ''} onChange={handleClassChange} className="p-2 rounded bg-white text-black w-full">
                            <option value="">Select a Class</option>
                            {classes.map(classItem => (
                                <option key={classItem.id} value={classItem.id}>
                                    {classItem.className}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedClass && (
                    <div className="mt-4">
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={{
                                title: {
                                    text: `Current Portfolio Value: $${totalStockValue.toFixed(2)}`
                                },
                                series: [{
                                    type: 'pie',
                                    data: selectedClass.stocks.map(stock => {
                                        const stockQuote = stockQuotes[stock.stockSymbol] || {};
                                        const stockValue = stock.amount * (stockQuote.price || 0);
                                        return {
                                            name: stock.stockSymbol,
                                            y: stockValue,
                                            z: stock.amount,
                                            dataLabels: {
                                                format: `${stock.stockSymbol}`
                                            }
                                        };
                                    })
                                }],
                                tooltip: {
                                    headerFormat: '',
                                    // eslint-disable-next-line no-template-curly-in-string
                                    pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.percentage:.1f}%</b> of total<br/>Shares: <b>{point.z:.2f}</b><br/>Value: <b>${point.y:.2f}</b><br/>'
                                }
                            }}
                        />
                    </div>
                )}

            </div>

            <div className="w-4/6 h-1/2 px-4">
                {selectedClass && <TransactionGrid transactions={selectedClass.transactions} />}
            </div>

            {isLoading && <LoadingModal />}
            {apiException && <ApiExceptionModal exception={apiException} />}
        </div>
    );

}

export default PortfolioView;
