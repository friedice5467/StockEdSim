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
                return <BuyView classesData={classes} classId={classId} />; 
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
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="w-full bg-blue-600 p-4 text-white">
                StockEdSim
                <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded float-right" onClick={logout}>Logout</button>
                <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded float-right me-3" onClick={() => setshowJoinClassModal(true)}>Join Class</button>
            </header>
            <div className="flex flex-1">
                <aside className="bg-gray-800 p-4 pt-16 h-full">
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
                                    <span className={`${activeClass === 'myclasses' ? 'rotate-180' : ''} absolute right-0 ml-auto mr-[0.8rem] transition-transform duration-300 ease-linear motion-reduce:transition-none h-3 w-3 text-gray-600 dark:text-gray-300`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="h-full w-full">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"></path>
                                        </svg>
                                    </span>
                                </a>
                            <TECollapse show={activeClass === 'myclasses'}>
                                {classes.map((classItem) => (
                                    <div key={classItem.id}>
                                        <a href={`#class-${classItem.id}`} onClick={(e) => toggleSubAccordion(classItem.id)}
                                            className="block p-2 bg-blue-500 rounded hover:bg-blue-600">{classItem.name}</a>

                                        <TECollapse show={activeSubClass === classItem.id}>
                                            <ul>
                                                <li>
                                                    <a href="#buy" onClick={(e) => handleNavigationClick(e, 'buyView', classItem.id)}
                                                        className="block p-2 pl-6 bg-blue-400 rounded hover:bg-blue-500">Buy</a>
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
                <main className="flex-1 p-10 bg-gray-100">
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
