import React, { useState, useEffect } from 'react';
import api from '../../../helpers/api';
import LoadingModal from '../../LoadingModal';
import ApiExceptionModal from '../../ApiExceptionModal';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

function LeaderboardGrid({ studentData })
{
    // eslint-disable-next-line no-unused-vars
    const [gridApi, setGridApi] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [columnApi, setColumnApi] = useState(null);

    const onGridReady = (params) => {
        setGridApi(params.api);
        setColumnApi(params.columnApi);

        // Automatically size all columns except ones with column ids
        const columnIds = params.columnApi.getColumns()
        params.columnApi.autoSizeColumns(columnIds);
    };

    const columnsDefs = [
        {
            headerName: 'Rank',
            field: 'Rank',
            sortable: true,
        },
        {
            headerName: 'Profile',
            field: 'ProfileImage.ImageUrl',
            sortable: false,
            cellRenderer: (params) => {
                const imgSrc = params.value || "/DefaultProfileImg.png";
                console.log(imgSrc);
                return (
                    <img src={imgSrc} alt="Profile" width="40" height="40" style={{ borderRadius: '50%' }} />
                );
            }
        },
        {
            headerName: 'Name',
            field: 'FullName',
            sortable: true,
            flex: 2
        },
        {
            headerName: 'Net Profit',
            field: 'Profit',
            sortable: true,
            cellStyle: params => ({
                color: params.value > 0 ? 'green' : 'red'
            }),
            flex: 1
        },
        {
            headerName: 'Portfolio Value',
            field: 'Portfolios',
            sortable: true,
            valueGetter: params => {
                const latestPortfolio = params.data.Portfolios[params.data.Portfolios.length - 1];
                return `$${latestPortfolio?.Valuation.toFixed(2)}`;
            },
            flex: 1
        }
    ];


    return (
        <div className="ag-theme-alpine" style={{ height: '100%', width: '100%', paddingTop: '1rem' }}>
            <AgGridReact
                columnDefs={columnsDefs}
                rowData={studentData}
                onGridReady={onGridReady}
                domLayout='autoHeight'
            />
        </div>
    );
}

function LeaderboardView({ classesData, studentData }) {
    const [selectedClass, setSelectedClass] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [apiException, setApiException] = useState(null);

    useEffect(() => {


        if (classesData && classesData.length === 1) {
            const defaultClass = classesData[0];
            const selectedClassId = defaultClass.id;
            setSelectedClass(defaultClass);
            fetchLeaderboardByClass(selectedClassId);
        }


    }, [classesData]);

    const fetchLeaderboardByClass = async (classId) => {
        try {
            setIsLoading(true);
            await api.get(`/market/leaderboards/${classId}`);
        }
        catch (error) {
            setApiException(error);
        }
        finally {
            setIsLoading(false);
        }
    }

    const handleClassChange = (event) => {
        const classId = event.target.value;
        const selected = classesData.find(c => c.id === classId);
        setSelectedClass(selected);
        fetchLeaderboardByClass(classId);
    };

    return (
        <div className="h-full w-full">

            {classesData && (
                <>
                    <div style={{maxHeight: '10%'} }>
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
                    <div style={{ maxHeight: '90%', width: '100%' }}>
                        <LeaderboardGrid studentData={studentData }/>
                    </div>
                </>
            )}


            {isLoading && <LoadingModal />}
            {apiException && <ApiExceptionModal exception={apiException} />}
        </div>
    );

}

export default LeaderboardView;