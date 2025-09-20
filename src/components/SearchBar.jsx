// src/components/SearchBar.jsx
export default function SearchBar({ query, setQuery }) {
  return (
    <input
      type="text"
      placeholder="🔍 Search Events..."
      value={query}
      onChange={e => setQuery(e.target.value)}
      style={{ padding: '8px', width: '100%', marginBottom: '16px' }}
    />
  );
}
