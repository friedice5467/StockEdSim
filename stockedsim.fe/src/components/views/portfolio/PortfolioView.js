import React, { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

NoDataToDisplay(Highcharts);

Highcharts.setOptions({
    lang: {
        noData: "No data available",
        rangeSelectorFrom: 'From',
        rangeSelectorTo: 'To'
    }
});


function PortfolioLineChart({ portfolioData, currentPortfolioValue }) {
    const dataWithCurrent = [
        ...portfolioData.map(item => [new Date(item.CalculatedDate).getTime(), item.Valuation]),
        [new Date().getTime(), currentPortfolioValue]
    ];

    const options = {
        title: {
            text: `Portfolio Value Over Time`
        },
        scrollbar: {
            enabled: false
        },
        series: [
            {
                type: 'line',
                name: '',
                data: dataWithCurrent,
                tooltip: {
                    valuePrefix: '$',  
                    valueDecimals: 2
                }
            },
        ],
        yAxis: {
            labels: {
                formatter: function () {
                    return `$${this.value.toFixed(2)}`;  
                }
            }
        },
        rangeSelector: {
            buttonTheme: {
                fill: 'none',
                stroke: 'none',
                'stroke-width': 0,
                r: 8,
                style: {
                    color: '#039',
                    fontWeight: 'bold'
                },
                states: {
                    hover: {
                    },
                    select: {
                        fill: '#039',
                        style: {
                            color: 'white'
                        }
                    }
                }
            },
            inputBoxBorderColor: 'gray',
            inputBoxWidth: 120,
            inputBoxHeight: 18,
            inputStyle: {
                color: '#039',
                fontWeight: 'bold'
            },
            labelStyle: {
                color: 'silver',
                fontWeight: 'bold'
            },
            selected: 6
        },
        noData: {
            position: {
                align: 'center',
                verticalAlign: 'middle'
            },
            style: {
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#303030'
            },
            useHTML: true,
            attr: { 'class': 'customNoData' }
        },
        credits: {
            enabled: false
        },
    };

    return (
        <HighchartsReact
            highcharts={Highcharts}
            containerProps={{ style: { height: "100%", width: "auto" } }}
            constructorType={'stockChart'}
            options={options}
        />
    );
}
function TransactionGrid({ transactions }) {
    const [gridApi, setGridApi] = useState(null);
    const [columnApi, setColumnApi] = useState(null);

    const onGridReady = (params) => {
        setGridApi(params.api);
        setColumnApi(params.columnApi);

        // Automatically size all columns except "Transaction Date"
        const columnIds = params.columnApi.getColumns()
        params.columnApi.autoSizeColumns(columnIds);
    };

    const columnDefs = [
        {
            colId: 'transactionDate',
            headerName: "Transaction Date",
            field: "transactionDate",
            filter: "agDateFilter",
            sortable: true,
            sort: 'desc',
            valueFormatter: params => new Date(params.value).toLocaleString()
        },
        {
            colId: 'stockSymbol',
            headerName: "Stock Symbol",
            field: "stockSymbol",
            filter: "agTextFilter",
            sortable: true
        },
        {
            headerName: "Transaction Type",
            field: "type",
            filter: "agTextFilter",
            valueGetter: params => params.data.type === 0 ? "Buy" : "Sell"
        },
        {
            headerName: "Price At Transaction",
            field: "priceAtTransaction",
            filter: "agNumberFilter",
            valueFormatter: params => `$${params.value.toFixed(2)}`
        },
        {
            colId: 'profit',
            headerName: "Average Net Profit",
            field: "netProfit",
            filter: "agNumberFilter",
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
            filter: "agNumberFilter",
            valueFormatter: params => `${params.value.toFixed(2)}`
        }
    ];

    return (
        <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
            <AgGridReact
                columnDefs={columnDefs}
                rowData={transactions}
                onGridReady={onGridReady}
                rowSelection={'multiple'}
                defaultColDef={{ flex: 1, resizable: true }}
                enableFilter={true}
            />
        </div>
    );
}

function PortfolioView({ classesData, portfolioData }) {
    const [selectedClass, setSelectedClass] = useState(null);
    const [stockQuotes, setStockQuotes] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiException, setApiException] = useState(null);

    useEffect(() => {
        var isFirstRun = false;
        const fetchData = async () => {
            setIsLoading(true);

            try {
                await api.get("/market/myprofile/dashboard");
                const classesDataApi = classesData;

                if (classesDataApi && classesDataApi.length === 1) {
                    const defaultClass = classesDataApi[0];
                    setSelectedClass(defaultClass);
                    fetchStockQuotes(defaultClass);
                }
            } catch (error) {
                setApiException(error);
            } finally {
                setIsLoading(false);
            }
        };
        if (!classesData && !isFirstRun) {
            fetchData();
            isFirstRun = true;
        } else {
            if (classesData && classesData.length === 1) {
                const defaultClass = classesData[0];
                const selectedClassId = defaultClass.id;
                setSelectedClass(defaultClass);
                fetchStockQuotes(defaultClass);
                fetchPortfolioValues(selectedClassId);
            }
        }

    }, [classesData]);

    const fetchPortfolioValues = async (classId) => {
        try {
            setIsLoading(true);
            await api.get(`/market/myprofile/getportfolioValue/${classId}`);
        }
        catch (error) {
            setApiException(error);
        }
        finally {
            setIsLoading(false);
        }
    }

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
        const selected = classesData.find(c => c.id === classId);
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

    let totalInvestmentValue = 0;
    if (selectedClass) {
        totalInvestmentValue = selectedClass.stocks.reduce((sum, stock) => {
            return sum + stock.amount * stock.purchasePrice;
        }, 0);
    }

    const percentChange = ((totalStockValue - totalInvestmentValue) / totalInvestmentValue) * 100;
    let currentPortfolioValue = 0;
    if (totalStockValue > 0 && selectedClass) {
        currentPortfolioValue = totalStockValue + selectedClass.classBalances[0].balance;
    }

    const color = percentChange >= 0 ? 'green' : 'red';
    const arrow = percentChange >= 0 ? '↑' : '↓';

    const titleText = `Current Assets Value: $${totalStockValue.toFixed(2)} (<span style="color: ${color}">${arrow} ${Math.abs(percentChange.toFixed(2))}%</span>)`;

    return (
        <div className="flex flex-col items-center h-full w-full text-black" style={{ boxSizing: 'border-box' }}>

            {selectedClass && (
                <p className="text-center text-xl font-bold mt-4">{selectedClass.className} - Available Spending Balance: ${selectedClass.classBalances[0].balance}</p>
            )}

            <div className="flex w-full px-4">

                <div className="w-1/2 mb-4 pr-2">
                    {classesData && (
                        <div className="my-2">
                            <label htmlFor="classDropdown" className="mr-2 font-bold">Select Class:</label>
                            <select id="classDropdown" value={selectedClass ? selectedClass.id : ''} onChange={handleClassChange} className="p-2 rounded bg-white text-black w-full">
                                <option value="">Select a Class</option>
                                {classesData.map(classItem => (
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
                                        text: titleText
                                    },
                                    credits: {
                                        enabled: false
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

                <div className="w-1/2 pt-8 mb-4 pl-2">
                    <PortfolioLineChart portfolioData={portfolioData} currentPortfolioValue={currentPortfolioValue} />
                </div>

            </div>

            <div className="w-full h-1/2 px-4">
                {selectedClass && <TransactionGrid transactions={selectedClass.transactions} />}
            </div>

            {isLoading && <LoadingModal />}
            {apiException && <ApiExceptionModal exception={apiException} />}
        </div>
    );

}

export default PortfolioView;
