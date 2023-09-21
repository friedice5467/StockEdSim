import React, { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import SellViewModal from './SellViewModal';
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
    const [isModalOpen, setIsModalOpen] = useState(false);


    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const targetClass = classesData.find(classItem => classItem.id === classId);
    const stockTransactions = targetClass && targetClass.transactions ? targetClass.transactions.filter(transaction => transaction.stockSymbol === stockSymbol) : [];
    const flagsData = stockTransactions.map(transaction => {
        return {
            x: new Date(transaction.transactionDate).getTime(),
            y: transaction.priceAtTransaction,
            title: transaction.type === 0 ? "B" : "S",
            color: transaction.type === 0 ? "red" : "green",
            text: `${transaction.type === 0 ? "Bought" : "Sold"} Price: ${transaction.priceAtTransaction.toFixed(2)} Amount: ${transaction.amount.toFixed(2)}`
        };
    });
    const allTimeHigh = chartData.reduce((max, data) => (data.h > max ? data.h : max), -Infinity);
    const allTimeLow = chartData.reduce((min, data) => (data.l < min ? data.l : min), Infinity);

    const options = {
        title: {
            text: `${stockSymbol}${stockSymbol ? ":" : ""} ${stockName}`
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
            {
                type: 'flags',
                data: flagsData,
                onSeries: 'dataseries',
                shape: 'flag',
                width: 8
            }
        ],
        yAxis: [{
            labels: {
                align: 'left'
            },
            height: '80%',
            resize: {
                enabled: true
            },
            plotLines: [{
                color: 'green', 
                dashStyle: 'shortdash',
                value: allTimeHigh, 
                width: 1, 
                label: {
                    text: `All-Time High 1YR $${allTimeHigh.toFixed(2)}`, 
                    align: 'left', 
                    style: {
                        color: 'green'
                    }
                },
                zIndex: 5
            }, {
                color: 'red', 
                dashStyle: 'shortdash',
                value: allTimeLow, 
                width: 1, 
                label: {
                    text: `All-Time Low 1YR $${allTimeLow.toFixed(2)}`,
                    align: 'left', 
                    style: {
                        color: 'red'
                    }
                },
                zIndex: 5
            }]
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
        },
        credits: {
            enabled: false
        },
        chart: {
            events: {
                render: function () {
                    const chart = this;
                    // remove the existing button to avoid duplication
                    if (chart.customButton) {
                        chart.customButton.destroy();
                    }

                    if (stockSymbol && latestStockPrice) {
                        chart.customButton = chart.renderer.button(
                            `Sell ${stockSymbol} at $${latestStockPrice.toFixed(2)}`,
                            chart.chartWidth / 2 - 70,
                            32,
                            function () {
                                openModal();
                            },
                            {
                                fill: '#E43A36',
                                r: 6,
                                padding: 10,
                                zIndex: 10,
                                style: {
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                },
                            },
                            {
                                fill: '#C5312D'
                            }
                        ).on('mouseover', function () {
                            chart.customButton.attr({
                                cursor: 'pointer'
                            });
                        }).add();
                    }
                }
            }
        }
    };

    useEffect(() => {
        async function fetchStocks() {
            try {
                setIsLoading(true);
                const response = await api.get("/market/symbols");
                const stocksData = response.data;
                const availStocks = targetClass.stocks;
                const stockSymbolsSet = new Set(availStocks.map(stock => stock.stockSymbol));

                const filteredStocks = stocksData.filter(stock => stockSymbolsSet.has(stock.symbol));
                console.log(filteredStocks);
                filteredStocks.sort((a, b) => a.symbol.localeCompare(b.symbol));

                setStocks(filteredStocks);
                setFilteredStocks(filteredStocks);
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

    return (
        <div className="flex h-full w-full">

            {/* HighchartsReact Area */}
            <div className="flex-1 pt-2 px-4 h-full" style={{ width: "80%" }}>

                <SellViewModal isModalOpen={isModalOpen} openModal={openModal} closeModal={closeModal} stockSymbol={stockSymbol}
                    updateClasses={updateClasses} classesData={classesData} classId={classId} stockPrice={latestStockPrice} />

                <HighchartsReact
                    highcharts={Highcharts}
                    containerProps={{ style: { height: "100%", width: "auto" } }}
                    constructorType={'stockChart'}
                    options={options}
                />
            </div>

            {/* Side Area */}
            <aside
                className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white h-full rounded-b-md relative shadow-lg"
                style={{ width: "20%", userSelect: 'none', boxShadow: '0px 2px 15px rgba(0, 0, 0, 0.15)' }}
            >
                <div className="relative mb-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 p-2 w-full bg-gray-700 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none text-gray-300 placeholder-gray-500 transition duration-150 ease-in-out"
                        value={searchStockStr}
                        onChange={e => {
                            setSearchStockStr(e.target.value);
                            debouncedSearchStocks(e.target.value);
                        }}
                        style={{ height: "5%" }}
                    />
                </div>
                <div style={{ height: "92%", width: "auto" }}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                width={width}
                                itemCount={filteredStocks.length}
                                itemSize={35}
                                className="list-container list-none"
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
