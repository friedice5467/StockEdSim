import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../helpers/AuthContext';
import api from '../helpers/api';
import ApiExceptionModal from './ApiExceptionModal';  
import LoadingModal from './LoadingModal';  
import JoinClassModal from './JoinClassModal';
import { TECollapse } from "tw-elements-react";

import ClassesView from './views/classes/ClassesView';
import BuyView from './views/trades/BuyView';
import SellView from './views/trades/SellView';
import PortfolioView from './views/portfolio/PortfolioView';

function DashboardPage() {
    const { currentUser } = useAuth();
    const userRole = currentUser && currentUser.role;
    const { logout } = useAuth();
    const [view, setView] = useState('default');
    const [isLoading, setIsLoading] = useState(false);
    const [apiException, setApiException] = useState(null);
    const [classes, setClasses] = useState([]);
    const [activeClass, setActiveClass] = useState("");
    const [tradeMode, setTradeMode] = useState('buy');
    const [classId, setClassId] = useState("");

    const [showJoinClassModal, setshowJoinClassModal] = useState(false);

    const handleUpdateClasses = useCallback((newClasses) => {
        setClasses(newClasses);
    }, []);


    useEffect(() => {
        const fetchClasses = async () => {
            if (currentUser) {
                setIsLoading(true);

                try {
                    const response = await api.get("/market/myprofile/dashboard");
                    setClasses(response.data);
                } catch (error) {
                    console.error("Error fetching classes:", error);
                    setApiException(error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchClasses();
    }, [currentUser]);

    const handleJoinClass = async (passedClassId) => {
        setIsLoading(true);

        try {
            const response = await api.post(`/market/joinClass/${passedClassId}`);
            console.log(response.data);
            setClasses(response.data);
            setshowJoinClassModal(false);
        } catch (error) {
            console.error("Error joining class:", error);
            setApiException(error);
        } finally {
            setIsLoading(false);
        }
    }

    const toggleAccordion = (classId) => {
        if (activeClass === classId) {
            setActiveClass("");
        } else {
            setActiveClass(classId);
        }
    };

    const handleNavigationClick = (e, view, classId) => {
        e.preventDefault();
        setClassId(classId);
        setView(view);
        setTradeMode('buy');
    };

    const renderMainContent = () => {
        if (view === 'buyView') {  
            return (
                <>
                    <div className="w-full max-h-1/20 flex">
                        <div className="w-4/5 text-gray-700 flex items-center justify-center">
                            <div className="relative inline-block w-48 text-gray-700" style={{ userSelect: 'none' }}>
                                <div className="flex items-center justify-between w-full bg-blue-200 py-2 rounded-full">
                                    <div
                                        className={`absolute top-0 bottom-0 rounded-full w-1/2 bg-blue-500 transition-transform duration-300 ease-in-out transform ${tradeMode === 'sell' ? 'translate-x-full' : ''}`}
                                    ></div>
                                    <button
                                        className="w-1/2 text-white z-10"
                                        onClick={() => setTradeMode('buy')}>
                                        Buy
                                    </button>
                                    <button
                                        className="w-1/2 text-white z-10"
                                        onClick={() => setTradeMode('sell')}>
                                        Sell
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div
                            className="w-1/5 text-white flex items-center justify-center bg-gradient-to-r from-gray-800 to-gray-700 shadow-lg rounded-t-md font-semibold text-xl tracking-wide border-b border-gray-700"
                            style={{ userSelect: 'none', boxShadow: '0px 2px 15px rgba(0, 0, 0, 0.15)' }}
                        >
                            {tradeMode === 'buy' ? "All Purchasable Stocks" : "All Owned Stocks"}
                        </div>

                    </div>
                    
                    <div className="h-19/20">
                    {tradeMode === 'buy' ? <BuyView classesData={classes} updateClasses={handleUpdateClasses} classId={classId} /> :
                            <SellView classesData={classes} classId={classId} />}
                    </div>
                </>
            );
        }
        switch (view) {
            case 'classes':
                return <ClassesView />;
            case 'buyView':
                return <BuyView classesData={classes} updateClasses={handleUpdateClasses} classId={classId} />; 
            case 'portfolioView':
                return <PortfolioView updateClasses={handleUpdateClasses} />
            //case 'sellView':
            //    return <SellView classesData={classes} classId={classId} />;
            // Add more cases as you expand the functionality
            default:
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-4">Welcome to your Stock Simulation Dashboard!</h2>
                        <p>Select an option from the side menu to get started.</p>
                    </>
                );
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-200">
            <header className="w-full bg-blue-600 xs:p-0 sm:p-1 md:p-1 lg:p-3 xl:p-3 text-white max-h-3/40">
                <div className="flex justify-between items-center">
                    <a className="font-semibold xs:text-xs sm:text-lg md:text-xl lg:text-2xl xl:text-2xl" href="/#" style={{ userSelect: 'none' }}>StockEdSim</a>
                    <div className="flex" style={{ userSelect: 'none' }}>
                        <button className="truncate bg-green-500 hover:bg-green-600 xs:text-xs sm:text-md md:text-lg lg:text-xl xl:text-xl font-bold xs:py-0 sm:py-0 lg:py-1 px-2 sm:px-3 md:px-4 rounded mr-3" onClick={() => setshowJoinClassModal(true)}>Join Class</button>
                        <button className="truncate bg-red-500 hover:bg-red-600  xs:text-xs sm:text-md md:text-lg lg:text-xl xl:text-xl font-bold xs:py-0 sm:py-0 lg:py-1 px-2 sm:px-3 md:px-4 rounded" onClick={logout}>Logout</button>
                    </div>
                </div>
            </header>
            <div className="flex flex-1 h-37/40">
                <aside className="bg-gray-800 p-4 pt-16 h-full w-auto sm:w-36 md:w-36 lg:w-36 overflow-y-auto shadow-lg" style={{userSelect: 'none'}}>
                <nav>
                    <ul className="space-y-2 text-white">
                        {(userRole === "Teacher" || userRole === "Admin") && (
                            <li>
                                <a href="#classes" onClick={(e) => handleNavigationClick(e, 'classes')}
                                    className="block p-2 bg-blue-600 rounded hover:bg-blue-700">My Classes Admin</a>
                            </li>
                        )}
                        <li>
                                <a href="#myclasses" onClick={(e) => toggleAccordion('myclasses')}
                                    className="block p-2 bg-blue-600 rounded hover:bg-blue-700 relative">
                                    My Classes
                                    <span className={`${activeClass === 'myclasses' ? 'rotate-180' : ''} absolute left-50 transition-transform duration-300 ease-linear motion-reduce:transition-none h-6 w-4 text-white-600 dark:text-gray-300`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-full w-full">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"></path>
                                        </svg>
                                    </span>
                                </a>
                            <TECollapse show={activeClass === 'myclasses'}>
                                {classes.map((classItem) => (
                                    <div key={classItem.id} className="ml-3">
                                        <a href={`#class-${classItem.id}`} onClick={(e) => handleNavigationClick(e, 'buyView', classItem.id)}
                                            className="block p-2 bg-blue-500 rounded hover:bg-blue-600 truncate w-full">{classItem.className}</a>
                                    </div>
                                ))}
                            </TECollapse>
                        </li>
                            <li><a href="#portfolio" onClick={(e) => handleNavigationClick(e, 'portfolioView')} className="block p-2 bg-blue-600 rounded hover:bg-blue-700">My Portfolio</a></li>
                            <li><a href="#leaderboard" onClick={(e) => handleNavigationClick(e, 'leaderboardView')}  className="block p-2 bg-blue-600 rounded hover:bg-blue-700">Leaderboards</a></li>
                            <li><a href="#settings" onClick={(e) => handleNavigationClick(e, 'settingsView')} className="block p-2 bg-blue-600 rounded hover:bg-blue-700">Settings</a></li>
                    </ul>
                </nav>
                </aside>
                <main className="flex-1 p-4 py-2 bg-gray-200 h-full w-full overflow-y-auto">
                    {renderMainContent()}
                </main>
            </div>

            {showJoinClassModal && <JoinClassModal onClose={() => setshowJoinClassModal(false)} onCreate={ handleJoinClass } /> }
            {isLoading && <LoadingModal />}
            {apiException && <ApiExceptionModal exception={apiException} />}
        </div>
    );
}

export default DashboardPage;
