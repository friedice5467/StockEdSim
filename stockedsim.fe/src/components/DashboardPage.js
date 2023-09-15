import React, { useState, useEffect } from 'react';
import { useAuth } from '../helpers/AuthContext';
import api from '../helpers/api';
import ApiExceptionModal from './ApiExceptionModal';  
import LoadingModal from './LoadingModal';  
import JoinClassModal from './JoinClassModal';
import { TECollapse } from "tw-elements-react";

import ClassesView from './views/classes/ClassesView';
import BuyView from './views/trades/BuyView';

/*import SellView from './views/trades/SellView';*/

function DashboardPage() {
    const { currentUser } = useAuth();
    const userRole = currentUser && currentUser.role;
    const { logout } = useAuth();
    const [view, setView] = useState('default');
    const [isLoading, setIsLoading] = useState(false);
    const [apiException, setApiException] = useState(null);
    const [classes, setClasses] = useState([]);
    const [activeClass, setActiveClass] = useState("");
    const [activeSubClass, setActiveSubClass] = useState("");
    const [classId, setClassId] = useState("");

    const [showJoinClassModal, setshowJoinClassModal] = useState(false);

    const handleUpdateClasses = (newClasses) => {
        setClasses(newClasses);
    };

    useEffect(() => {
        if (currentUser) {
            setIsLoading(true);

            api.get("/market/myprofile/GetClasses")
                .then(response => {
                    setClasses(response.data);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching classes:", error);
                    setApiException(error);
                    setIsLoading(false);
                });
        }
    }, [currentUser]);

    const handleJoinClass = (passedClassId) => {
        setIsLoading(true);
        api.post(`/market/joinClass/${passedClassId}`)
            .then(response => {
                console.log(response.data);
                setClasses(response.data);
                setshowJoinClassModal(false);
                setIsLoading(false);
            })
            .catch(error => {
                console.error("Error fetching classes:", error);
                setApiException(error);
                setIsLoading(false);
            });
    }

    const toggleAccordion = (classId) => {
        if (activeClass === classId) {
            setActiveClass("");
        } else {
            setActiveClass(classId);
        }
    };

    const toggleSubAccordion = (classId) => {
        if (activeSubClass === classId) {
            setActiveSubClass("");
        } else {
            setActiveSubClass(classId);
        }
    };

    const handleNavigationClick = (e, view, classId) => {
        e.preventDefault();
        setClassId(classId);
        setView(view);
    };

    const renderMainContent = () => {
        switch (view) {
            case 'classes':
                return <ClassesView />;
            case 'buyView':
                return <BuyView classesData={classes} updateClasses={handleUpdateClasses} classId={classId} />; 
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
        <div className="flex flex-col h-full w-full bg-gray-100">
            <header className="w-full bg-blue-600 xs:p-0 sm:p-1 md:p-1 lg:p-3 xl:p-3 text-white max-h-3/40">
                <div className="flex justify-between items-center">
                    <div className="font-semibold xs:text-xs sm:text-lg md:text-xl lg:text-2xl xl:text-2xl">StockEdSim</div>
                    <div className="flex">
                        <button className="truncate bg-green-500 hover:bg-green-700 xs:text-xs sm:text-md md:text-lg lg:text-xl xl:text-xl font-bold xs:py-0 sm:py-0 lg:py-1 px-2 sm:px-3 md:px-4 rounded mr-3" onClick={() => setshowJoinClassModal(true)}>Join Class</button>
                        <button className="truncate bg-red-500 hover:bg-red-700  xs:text-xs sm:text-md md:text-lg lg:text-xl xl:text-xl font-bold xs:py-0 sm:py-0 lg:py-1 px-2 sm:px-3 md:px-4 rounded" onClick={logout}>Logout</button>
                    </div>
                </div>
            </header>
            <div className="flex flex-1 h-37/40">
                <aside className="bg-gray-800 p-4 pt-16 h-full w-auto sm:w-36 md:w-36 lg:w-36 overflow-y-auto">
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
                                        <a href={`#class-${classItem.id}`} onClick={(e) => toggleSubAccordion(classItem.id)}
                                            className="block p-2 bg-blue-500 rounded hover:bg-blue-600 truncate w-full">{classItem.className}</a>

                                        <TECollapse show={activeSubClass === classItem.id}>
                                            <ul className="ml-3">
                                                <li>
                                                    <a href="#buy" onClick={(e) => handleNavigationClick(e, 'buyView', classItem.id)}
                                                        className="block p-2 pl-6 bg-blue-400 rounded hover:bg-blue-500 mb-1">Buy</a>
                                                </li>
                                                <li>
                                                    <a href="#sell" onClick={(e) => handleNavigationClick(e, 'sellView', classItem.id)}
                                                        className="block p-2 pl-6 bg-blue-400 rounded hover:bg-blue-500">Sell</a>
                                                </li>
                                            </ul>
                                        </TECollapse>
                                    </div>
                                ))}
                            </TECollapse>
                        </li>
                        <li><a href="#portfolio" className="block p-2 bg-blue-600 rounded hover:bg-blue-700">My Portfolio</a></li>
                        <li><a href="#transactions" className="block p-2 bg-blue-600 rounded hover:bg-blue-700">Transactions</a></li>
                        <li><a href="#leaderboard" className="block p-2 bg-blue-600 rounded hover:bg-blue-700">Leaderboard</a></li>
                        <li><a href="#settings" className="block p-2 bg-blue-600 rounded hover:bg-blue-700">Settings</a></li>
                    </ul>
                </nav>
                </aside>
                <main className="flex-1 p-5 bg-gray-100 h-full w-full overflow-y-auto">
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
