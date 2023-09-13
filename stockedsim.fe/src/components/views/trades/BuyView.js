import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../helpers/api';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import BuyViewModal from './BuyViewModal';
import { createChart } from 'lightweight-charts';

function BuyView({ classesData, classId }) {
    const [stocks, setStocks] = useState([]);
    const [stockSymbol, setStockSymbol] = useState("");
    const [stockName, setStockName] = useState("");
    const [chartData, setChartData] = useState([]);
    const chartRef = useRef(null);
    const lineSeriesRef = useRef(null);  
    const [chart, setChart] = useState(null);
    const lastAverageRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [isFirstRun, setIsFirstRun] = useState(true);

    const updateBaseValueForVisibleRange = useCallback((visibleRange) => {
        if (visibleRange && lineSeriesRef.current) {
            const fromTimestamp = new Date(visibleRange.from.year, visibleRange.from.month - 1, visibleRange.from.day).getTime() / 1000;
            const toTimestamp = new Date(visibleRange.to.year, visibleRange.to.month - 1, visibleRange.to.day).getTime() / 1000;

            const visibleData = chartData.filter(data => {
                const dateValue = data.date.getTime() / 1000;
                return dateValue >= fromTimestamp && dateValue <= toTimestamp;
            });

            if (visibleData.length > 0) {
                const averageVisiblePrice = visibleData.reduce((sum, data) => sum + data.c, 0) / visibleData.length;
                if (lastAverageRef.current === null || Math.abs(lastAverageRef.current - averageVisiblePrice) > 0.01) {
                    lastAverageRef.current = averageVisiblePrice;

                    chart.removeSeries(lineSeriesRef.current);

                    lineSeriesRef.current = chart.addBaselineSeries({
                        baseValue: { type: 'price', price: averageVisiblePrice },
                        topLineColor: 'rgba( 38, 166, 154, 1)',
                        topFillColor1: 'rgba( 38, 166, 154, 0.28)',
                        topFillColor2: 'rgba( 38, 166, 154, 0.05)',
                        bottomLineColor: 'rgba( 239, 83, 80, 1)',
                        bottomFillColor1: 'rgba( 239, 83, 80, 0.05)',
                        bottomFillColor2: 'rgba( 239, 83, 80, 0.28)'
                    });
                    lineSeriesRef.current.setData(chartData.map(data => ({
                        time: data.date.toISOString().split('T')[0],
                        value: data.c,
                    })));
                }
            }
        }
    }, [chartData, chart]);

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                if (!isFirstRun) return;
                setIsLoading(true);
                const response = await api.get("/market/symbols");
                setStocks(response.data);
            } catch (error) {
                console.error("Error fetching stock symbols:", error);
                setApiError("Error fetching stock symbols.");
            } finally {
                setIsFirstRun(false);
                setIsLoading(false);
            }
        };

        fetchStocks();

        const handleResize = () => {
            if (chart && chartRef.current) {
                chart.resize(chartRef.current.clientWidth, chartRef.current.clientHeight);
            }
        };

        if (!chart && chartRef.current) {
            const newChart = createChart(chartRef.current, {
                width: chartRef.current.clientWidth,
                height: chartRef.current.clientHeight,
                layout: {
                    backgroundColor: '#ffffff',
                    textColor: '#333',
                },
                grid: {
                    vertLines: {
                        color: '#e2e5e8',
                    },
                    horzLines: {
                        color: '#e2e5e8',
                    },
                },
                rightPriceScale: {
                    scaleMargins: {
                        top: 0.2,
                        bottom: 0.2,
                    },
                },
            });
            setChart(newChart);
        }

        if (chart && chartData.length > 0) {
            const averagePrice = chartData.reduce((sum, data) => sum + data.c, 0) / chartData.length;

            if (!lineSeriesRef.current) {
                lineSeriesRef.current = chart.addBaselineSeries({
                    baseValue: { type: 'price', price: averagePrice },
                    topLineColor: 'rgba( 38, 166, 154, 1)',
                    topFillColor1: 'rgba( 38, 166, 154, 0.28)',
                    topFillColor2: 'rgba( 38, 166, 154, 0.05)',
                    bottomLineColor: 'rgba( 239, 83, 80, 1)',
                    bottomFillColor1: 'rgba( 239, 83, 80, 0.05)',
                    bottomFillColor2: 'rgba( 239, 83, 80, 0.28)'
                });
            }

            lineSeriesRef.current.setData(chartData.map(data => ({
                time: data.date.toISOString().split('T')[0],
                value: data.c,
            })));

            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            chart.timeScale().setVisibleRange({
                from: oneMonthAgo.toISOString().split('T')[0],
                to: new Date().toISOString().split('T')[0],
            });

            const handleVisibleTimeRangeChange = (newVisibleTimeRange) => {
                if (newVisibleTimeRange) {
                    updateBaseValueForVisibleRange(newVisibleTimeRange);
                }
            };

            const unsubscribe = chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange);

            return () => {
                unsubscribe();
                window.removeEventListener('resize', handleResize);
            }
        }

        window.addEventListener('resize', handleResize);

    }, [chartData, chart, isFirstRun, updateBaseValueForVisibleRange]);

    const handleStockClick = async (symbol, description) => {
        try {
            setIsLoading(true);
            const response = await api.get(`/market/candle/${symbol}`);

            if (response.data.s === "ok") {
                const { t, ...priceData } = response.data;
                const mappedData = t.map((timestamp, index) => {
                    const entry = { date: new Date(timestamp * 1000) };
                    Object.keys(priceData).forEach(key => {
                        entry[key] = priceData[key][index];
                    });
                    return entry;
                });
                setChartData(mappedData);
                setStockSymbol(symbol);
                setStockName(description);
            } else {
                console.error("No data for stock candles:", symbol);
                setApiError("No data for stock candles.");
            }
        } catch (error) {
            console.error("Error fetching stock candles:", error);
            setApiError("Error fetching stock candles.");
        } finally {
            setIsLoading(false);
        }
    };

    const latestStockPrice = chartData.length > 0 ? chartData[chartData.length - 1].c : null;

    return (
        <div className="flex h-full">
            <div className="flex-1 pt-2 px-4 h-full">
                {chartData.length > 0 && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h2 className="text-xl font-bold">{stockSymbol}</h2>
                                <p className="text-gray-600 truncate">{stockName}</p>
                            </div>
                            <div className="flex items-center">
                                <div className="text-lg font-bold text-green-500 mr-2">${latestStockPrice}</div>
                                <BuyViewModal stockSymbol={stockSymbol} classesData={classesData} classId={classId} />
                            </div>
                        </div>
                        <div ref={chartRef} className="flex-grow" />
                    </div>
                )}
            </div>

            <aside className="w-72 p-4 bg-gray-800 text-white">
                <input type="text" placeholder="Search..." className="mb-4 p-2 w-full rounded" />
                <ul className="overflow-y-auto h-37/40">
                    {stocks
                        .sort((a, b) => a.symbol.localeCompare(b.symbol))
                        .map(stock => (
                            <li key={stock.symbol} onClick={() => handleStockClick(stock.symbol, stock.description)} className="mb-2 cursor-pointer hover:bg-gray-700 rounded p-2 truncate">
                                <strong>{stock.symbol}</strong>: {stock.description}
                            </li>
                        ))}
                </ul>
            </aside>

            {isLoading && <LoadingModal />}
            {apiError && <ApiExceptionModal error={apiError} onClose={() => setApiError(null)} />}
        </div>
    );
}

export default BuyView;
