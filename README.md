# StockEdSim: The Financial Educational Simulator

**StockEdSim** offers a sophisticated yet user-friendly platform geared towards demystifying stock trading for educational environments. Rooted in a high school experience that once relied on pen and paper, this simulation transforms the essence of stock trading into an interactive, immersive digital experience. Students and educators can now dive deep into the mechanics of stock trading without the risks associated with the real-world stock market.
![image](https://github.com/friedice5467/StockEdSim/assets/58054670/29fb6b19-e372-4732-92f0-bd9fc031f1c2)

## **Key Features**

- **Robust User Authentication**: Employing JWT tokens and ASP.NET Identity to ensure a seamless and secure user experience.
  
- **Dynamic Dashboard**: A central hub offering an instantaneous overview of stock performances, detailed transaction histories, evolving portfolio insights, and classroom associations.
  
- **Live Stock Transactions**: Experience the highs and lows of stock trading through real-time transaction simulations, all without the real-world financial stakes.
  
- **Classroom Oversight**: A dedicated feature allowing educators to effortlessly track, monitor, and adjust class balances, ensuring a cohesive learning journey for students.
  
- **Leaderboards**: Foster a competitive spirit! Students can rank their performances against their peers, striving for the pinnacle of trading success.

## **Technology Stack**

- **Backend**: ASP.NET Identity, .NET Core, Entity Framework Core, Docker, Webjobs
- **Frontend**: React, Tailwind CSS
- **Database**: PostgreSQL
- **Real-time Interaction**: SignalR

## **Performance and Scalability**

- **Rate Limiting**: Ensures system stability by controlling the frequency of requests a user or client can make in a set period.
  
- **Server-Side Caching**: Enhances responsiveness by storing frequently accessed data on the server, reducing database calls.
  
- **Client-Side Caching**: Speeds up UI load times by keeping regularly used data on the client side, minimizing redundant server requests.
  
- **Hybrid-Session Based**: Merges stateful and stateless interactions, optimizing user experience and system efficiency through SignalR.
  

## **Getting Started**

1. Register an account at https://stock-ed-sim.netlify.app/
2. Join a class using this Id ``c25d3032-4bc8-4f40-960a-6b64cbd9c5bc``
3. Enjoy!

## **Upcoming Enhancements**

1. Update front end GUI to make it look better
2. Group chat
3. 2FA
4. Day trading
5. Maybe other options aside from stocks

## **Contributing**

Your insights can shape the future of StockEdSim! If you'd like to recommend improvements or report any anomalies, please initiate a pull request or log an issue. For major alterations, it's best to engage in a discussion beforehand.

## **License**

[APACHE License](https://github.com/friedice5467/StockEdSim/blob/master/LICENSE.txt)
