import React, { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import BuyViewModal from './BuyViewModal';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import NoDataToDisplay from 'highcharts/modules/no-data-to-display';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import debounce from 'lodash/debounce';

NoDataToDisplay(Highcharts);

Highcharts.setOptions({
    lang: {
        noData: "No data available, select a stock to continue",
        rangeSelectorFrom: 'From',
        rangeSelectorTo: 'To'
    }
});

function SellView({ classesData, updateClasses, classId }) {
    const [stocks, setStocks] = useState([]);
    const [stockSymbol, setStockSymbol] = useState("");
    const [stockName, setStockName] = useState("");
    const [searchStockStr, setSearchStockStr] = useState("");
    const [filteredStocks, setFilteredStocks] = useState(stocks);
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [isFirstRun, setIsFirstRun] = useState(true);

    const options = {
        title: {
            text: `${stockSymbol}: ${stockName}`
        },
        scrollbar: {
            enabled: false
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
        }
    };

    useEffect(() => {
        async function fetchStocks() {
            try {
                setIsLoading(true);
                const response = await api.get("/market/symbols");
                setStocks(response.data);
                setFilteredStocks(response.data.sort((a, b) => a.symbol.localeCompare(b.symbol)));
            } catch (error) {
                setApiError("Error fetching stock symbols.");
            } finally {
                setIsFirstRun(false);
                setIsLoading(false);
            }
        }
        if (isFirstRun) fetchStocks();
    }, [isFirstRun]);

    const debouncedSearchStocks = debounce((value) => {
        if (value.trim() === '') {
            setFilteredStocks(stocks.sort((a, b) => a.symbol.localeCompare(b.symbol)));
            return;
        }
        const lowercasedValue = value.toLowerCase();
        const results = stocks.filter(stock => {
            return stock.symbol.toLowerCase().includes(lowercasedValue) || stock.description.toLowerCase().includes(lowercasedValue);
        });

        setFilteredStocks(results.sort((a, b) => a.symbol.localeCompare(b.symbol)));
    }, 300);  // 300ms delay

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

    const Row = ({ index, style }) => {
        const stock = filteredStocks[index];
        return (
            <li style={style} key={stock.symbol} onClick={() => handleStockClick(stock.symbol, stock.description)} className="mb-2 cursor-pointer hover:bg-gray-700 rounded p-2 truncate">
                <strong>{stock.symbol}</strong>: {stock.description}
            </li>
        );
    };

    const latestStockPrice = chartData.length > 0 ? chartData[chartData.length - 1].c : null;
    const allTimeHigh = chartData.reduce((max, data) => (data.c > max ? data.c : max), -Infinity);
    const allTimeLow = chartData.reduce((min, data) => (data.c < min ? data.c : min), Infinity);

    return (
        <div className="flex h-full w-full">

            {/* HighchartsReact Area */}
            <div className="flex-1 pt-2 px-4 h-full" style={{ width: "80%" }}>
                {/* Top Bar with Pills and BuyViewModal */}
                <div className="flex justify-between items-center w-full px-4 mb-2" style={{ height: "7%" }}>
                    {
                        stockSymbol && latestStockPrice &&
                        <>
                            <div className="flex space-x-4" style={{ maxWidth: "50%", maxHeight: "100%" }}>
                                <div className="bg-green-500 text-white px-4 py-1 rounded text-md flex items-center space-x-2 truncate">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">hm y
                                        <path d="M8 1L3 6h10L8 1z"></path>
                                    </svg>
                                    <span>1 YR ATH: ${allTimeHigh?.toFixed(2) ?? ''}</span>
                                </div>
                                <div className="bg-red-500 text-white px-4 py-1 rounded text-md flex items-center space-x-2 truncate">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 15L3 10h10l-5 5z"></path>
                                    </svg>
                                    <span>1YR ATL: ${allTimeLow?.toFixed(2) ?? ''}</span>
                                </div>
                            </div>
                            <div style={{ maxWidth: "50%", maxHeight: "100%" }}>
                                <BuyViewModal stockSymbol={stockSymbol} updateClasses={updateClasses} classesData={classesData} classId={classId} stockPrice={latestStockPrice} />
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

            {/* Side Area */}
            <aside className="p-4 bg-gray-800 text-white h-full" style={{ width: "20%" }}>
                <input
                    type="text"
                    placeholder="Search..."
                    className="mb-4 p-2 w-full rounded-lg focus:ring focus:ring-green-400 focus:outline-none text-black"
                    value={searchStockStr}
                    onChange={e => {
                        setSearchStockStr(e.target.value);
                        debouncedSearchStocks(e.target.value);
                    }}
                    style={{ height: "5%" }}
                />
                <div style={{ height: "92%", width: "auto" }}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                width={width}
                                itemCount={filteredStocks.length}
                                itemSize={35}
                            >
                                {Row}
                            </List>
                        )}
                    </AutoSizer>
                </div>

            </aside>

            {isLoading && <LoadingModal />}
            {apiError && <ApiExceptionModal error={apiError} onClose={() => setApiError(null)} />}
        </div>
    );
}

export default SellView;
