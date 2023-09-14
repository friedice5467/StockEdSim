import React, { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import BuyViewModal from './BuyViewModal';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';

NoDataToDisplay(Highcharts);

Highcharts.setOptions({
    lang: {
        noData: "No data available, select a stock to continue"
    }
});

function BuyView({ classesData, classId }) {
    const [stocks, setStocks] = useState([]);
    const [stockSymbol, setStockSymbol] = useState("");
    const [stockName, setStockName] = useState("");
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [isFirstRun, setIsFirstRun] = useState(true);

    useEffect(() => {
        async function fetchStocks() {
            try {
                setIsLoading(true);
                const response = await api.get("/market/symbols");
                setStocks(response.data);
            } catch (error) {
                setApiError("Error fetching stock symbols.");
            } finally {
                setIsFirstRun(false);
                setIsLoading(false);
            }
        }
        if (isFirstRun) fetchStocks();
    }, [isFirstRun]);

    const handleStockClick = async (symbol, description) => {
        try {
            setIsLoading(true);
            const response = await api.get(`/market/candle/${symbol}`);
            if (response.data.s === "ok") {
                const mappedData = response.data.t.map((timestamp, index) => ({
                    date: new Date(timestamp * 1000),
                    o: response.data.o[index],
                    h: response.data.h[index],
                    l: response.data.l[index],
                    c: response.data.c[index],
                    v: response.data.v[index]
                }));
                setChartData(mappedData);
                setStockSymbol(symbol);
                setStockName(description);
            } else {
                setApiError("No data for stock candles.");
            }
        } catch (error) {
            setApiError("Error fetching stock candles.");
        } finally {
            setIsLoading(false);
        }
    };

    const options = {
        title: {
            text: `${stockSymbol}: ${stockName}`
        },
        series: [
            {
                type: 'ohlc',
                name: `${stockSymbol} Stock Price`,
                data: chartData.map(item => [item.date.getTime(), item.o, item.h, item.l, item.c]),
                tooltip: {
                    valueDecimals: 2
                }
            },
            {
                type: 'column',
                name: 'Volume',
                data: chartData.map(item => [item.date.getTime(), item.v]),
                yAxis: 1,
            },
        ],
        yAxis: [{
            labels: {
                align: 'left'
            },
            height: '80%',
            resize: {
                enabled: true
            }
        }, {
            labels: {
                align: 'left'
            },
            top: '80%',
            height: '20%',
            offset: 0
        }],
        rangeSelector: {
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
        }
    };

    const latestStockPrice = chartData.length > 0 ? chartData[chartData.length - 1].c : null;
    const allTimeHigh = chartData.reduce((max, data) => (data.c > max ? data.c : max), -Infinity);
    const allTimeLow = chartData.reduce((min, data) => (data.c < min ? data.c : min), Infinity);

    return (
        <div className="flex h-full">

            {/* HighchartsReact Area */}
            <div className="flex-1 pt-2 px-4 h-full">
                {/* Top Bar with Pills and BuyViewModal */}
                <div className="flex justify-between items-center w-full px-4 mb-2" style={{ height: "7%" }}>
                    {
                        stockSymbol && latestStockPrice &&
                        <>
                            <div className="flex space-x-4">
                                <div className="bg-green-500 text-white px-4 py-1 rounded-lg text-md flex items-center space-x-2">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 1L3 6h10L8 1z"></path>
                                    </svg>
                                    <span>1 YR ATH: ${allTimeHigh?.toFixed(2) ?? ''}</span>
                                </div>
                                <div className="bg-red-500 text-white px-4 py-1 rounded-lg text-md flex items-center space-x-2">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 15L3 10h10l-5 5z"></path>
                                    </svg>
                                    <span>1YR ATL: ${allTimeLow?.toFixed(2) ?? ''}</span>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <BuyViewModal stockSymbol={stockSymbol} classesData={classesData} classId={classId} stockPrice={latestStockPrice} />
                            </div>
                        </>
                    }
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    containerProps={{ style: { height: "92%", width: "auto" } }}
                    constructorType={'stockChart'}
                    options={options}
                />
            </div>

            {/* Side Area (Aside) */}
            <aside className="w-72 p-4 bg-gray-800 text-white h-full">
                <input
                    type="text"
                    placeholder="Search..."
                    className="mb-4 p-2 w-full rounded-lg focus:ring focus:ring-green-400 focus:outline-none"
                />
                <ul className="overflow-y-auto" style={{height: "93%"}}>
                    {stocks.sort((a, b) => a.symbol.localeCompare(b.symbol)).map(stock => (
                        <li key={stock.symbol} onClick={() => handleStockClick(stock.symbol, stock.description)} className="mb-2 cursor-pointer hover:bg-gray-700 rounded p-2 truncate">
                            <strong>{stock.symbol}</strong>: {stock.description}
                        </li>
                    ))}
                </ul>
            </aside>

            {/* Modals */}
            {isLoading && <LoadingModal />}
            {apiError && <ApiExceptionModal error={apiError} onClose={() => setApiError(null)} />}
        </div>
    );
}

export default BuyView;
