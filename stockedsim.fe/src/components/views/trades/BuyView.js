import React, { useState, useEffect } from 'react';
import { ChartCanvas, Chart, series, scale, coordinates, tooltip, axes } from "react-financial-charts";
import { timeInterval } from "d3-time";
import { format } from "d3-format";
import api from '../../../../helpers/api';
import LoadingModal from '../../../LoadingModal';
import ApiExceptionModal from '../../../ApiExceptionModal';
import BuyViewModal from './BuyViewModal';

const { CandlestickSeries } = series;
const { XAxis, YAxis } = axes;
const { CrossHairCursor, MouseCoordinateX, MouseCoordinateY } = coordinates;
const { OHLCTooltip } = tooltip;

function BuyView(classesData, classId) {
    const [stocks, setStocks] = useState([]);
    const [stockSymbol, setStockSymbol] = useState("");
    const [chartData, setChartData] = useState([]);
    const [chartWidth, setChartWidth] = useState(window.innerWidth - 300); 
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                setIsLoading(true);
                const response = await api.get("symbols");
                setStocks(response.data);
            } catch (error) {
                console.error("Error fetching stock symbols:", error);
                setApiError("Error fetching stock symbols.");
            }
            finally {
                setIsLoading(false);
            }
        };

        fetchStocks();

        const handleResize = () => {
            setChartWidth(window.innerWidth - 300);
        };

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleStockClick = async (symbol) => {
        try {
            setIsLoading(true);
            const response = await api.get(`candle/${symbol}`);
            const data = response.data;
            if (data.s === "ok") {
                const mappedData = data.t.map((timestamp, index) => ({
                    date: new Date(timestamp * 1000),
                    open: data.o[index],
                    high: data.h[index],
                    low: data.l[index],
                    close: data.c[index],
                    volume: data.v[index]
                }));
                setChartData(mappedData);
                setStockSymbol(symbol);
            } else {
                console.error("No data for stock candles:", symbol);
                setApiError("No data for stock candles.");
            }
        } catch (error) {
            console.error("Error fetching stock candles:", error);
            setApiError("Error fetching stock candles.");
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex">
            <aside className="w-72 p-4 bg-gray-800 text-white overflow-y-auto">
                <input type="text" placeholder="Search..." className="mb-4 p-2 w-full rounded" />
                <ul>
                    {stocks.map(stock => (
                        <li key={stock.symbol} onClick={() => handleStockClick(stock.symbol)} className="mb-2 cursor-pointer hover:bg-gray-700 rounded p-2 truncate">
                            <strong>{stock.symbol}</strong>: {stock.description}
                        </li>
                    ))}
                </ul>
            </aside>

            <div className="flex-1 p-4">
                {chartData.length > 0 && (
                    <ChartCanvas
                        height={500}
                        width={chartWidth}
                        ratio={window.devicePixelRatio}
                        margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
                        type="hybrid"
                        seriesName="Data"
                        data={chartData}
                        xAccessor={d => d.date}
                        xScale={scale.discontinuousTimeScaleProvider.inputDateAccessor(d => d.date)}
                        xExtents={[chartData[0].date, chartData[chartData.length - 1].date]}
                    >
                        <Chart yExtents={d => [d.high, d.low]}>
                            <XAxis tickLabelFill="#FFFFFF" />
                            <YAxis tickLabelFill="#FFFFFF" />
                            <CandlestickSeries />
                            <OHLCTooltip origin={[0, 0]} />
                            <MouseCoordinateY
                                at="right"
                                orient="right"
                                displayFormat={format(".2f")}
                            />
                            <MouseCoordinateX
                                at="bottom"
                                orient="bottom"
                                displayFormat={timeInterval.format("%Y-%m-%d")}
                            />
                        </Chart>
                        <CrossHairCursor />
                    </ChartCanvas>
                )}
            </div>
            <BuyViewModal stockSymbol={stockSymbol} classesData={classesData} classId={classId} />

            {isLoading && <LoadingModal />}
            {apiError && <ApiExceptionModal error={apiError} onClose={() => setApiError(null)} />}
        </div>
    );
}

export default BuyView;
