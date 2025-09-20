import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await supabase.from("events").select("*");
    if (error) {
      console.error("Error fetching events:", error.message);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  // filter
  const filteredEvents = events.filter((event) =>
    (event.name || "").toLowerCase().includes(query.toLowerCase()) ||
    (event.type || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="container">
      <h1>📅 Event List</h1>

      <input
        type="text"
        placeholder="🔍 Search Events…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          padding: "8px",
          marginBottom: "16px",
          width: "100%",
          maxWidth: "400px",
        }}
      />

      {loading ? (
        <p>Loading events...</p>
      ) : filteredEvents.length > 0 ? (
        filteredEvents.map((event) => (
          <div key={event.id} className="card">
            <h2>
              {event.type}: {event.name}
            </h2>
            <p>
              📍 {event.location} | 📅 {event.date}
            </p>
            <Link to={`/event/${event.id}`}>
              <button>จองบัตร</button>
            </Link>
          </div>
        ))
      ) : (
        <p>No events found.</p>
      )}
    </div>
  );
}
