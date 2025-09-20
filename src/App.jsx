import React from "react";

import { Routes, Route, Link } from "react-router-dom";

import EventList from "./pages/EventList.jsx";

import EventDetail from "./pages/EventDetail.jsx";

import BookingSummary from "./pages/BookingSummary.jsx";


 
export default function App() {

  return (
<div>
<nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
<Link to="/" style={{ marginRight: "1rem" }}>Event List</Link>
<Link to="/event/1" style={{ marginRight: "1rem" }}>Event Detail</Link>
<Link to="/booking" style={{ marginRight: "1rem" }}>Booking Summary</Link>

</nav>
<Routes>
<Route path="/" element={<EventList />} />
<Route path="/event/:id" element={<EventDetail />} />
<Route path="/booking/:ticketId?" element={<BookingSummary />} />
</Routes>
</div>

  );

}

 