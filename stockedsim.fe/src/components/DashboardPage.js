import React, { useState, useEffect } from 'react';
import { useAuth } from '../helpers/AuthContext';
import api from '../helpers/api';
import ApiExceptionModal from './ApiExceptionModal';  
import LoadingModal from './LoadingModal';  
import { TECollapse } from "tw-elements-react";

import ClassesView from './views/classes/ClassesView';
import BuyView from './views/trades/BuyView';
import SellView from './views/trades/SellView';

function DashboardPage() {
    const { currentUser } = useAuth();
    const userRole = currentUser && currentUser.role;

    const [view, setView] = useState('default');
    const [isLoading, setIsLoading] = useState(false);
    const [apiException, setApiException] = useState(null);
    const [classes, setClasses] = useState([]);
    const [activeClass, setActiveClass] = useState("");
    const [activeSubClass, setActiveSubClass] = useState("");
    const [classId, setClassId] = useState("");

    useEffect(() => {
        if (currentUser) {
            setIsLoading(true);

            api.get("myprofile/GetClasses")
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
            case 'sellView':
                return <SellView classesData={classes} classId={classId} />;
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
        <div className="flex h-screen bg-gray-100">
            <header className="w-full bg-blue-600 p-4 text-white fixed">
                StockEdSim
                <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded float-right">Logout</button>
            </header>
            <aside className="bg-gray-800 p-4 pt-16 h-full fixed">
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
                                className="block p-2 bg-blue-600 rounded hover:bg-blue-700">My Classes</a>
                            <TECollapse isOpen={activeClass === 'myclasses'}>
                                {classes.map((classItem) => (
                                    <div key={classItem.id}>
                                        <a href={`#class-${classItem.id}`} onClick={(e) => toggleSubAccordion(classItem.id)}
                                            className="block p-2 bg-blue-500 rounded hover:bg-blue-600">{classItem.name}</a>

                                        <TECollapse isOpen={activeSubClass === classItem.id}>
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
            <main className="flex-1 p-10 pt-16 bg-gray-100">
                {renderMainContent()}
            </main>

            {isLoading && <LoadingModal />}
            {apiException && <ApiExceptionModal exception={apiException} />}
        </div>
    );
}

export default DashboardPage;
