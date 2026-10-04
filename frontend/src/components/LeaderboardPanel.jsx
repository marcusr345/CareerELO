import { useEffect, useState } from 'react';
import axios from 'axios';

const DIMENSIONS = [
  ['global', 'Global Career ELO'],
  ['country', 'Country Career ELO'],
  ['university', 'University Career ELO'],
  ['company', 'Company Career ELO'],
  ['ageGroup', 'Age-group Career ELO']
];

export default function LeaderboardPanel({ entries = [] }) {
  const [dimension, setDimension] = useState('global');
  const [filterValue, setFilterValue] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('generalElo');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ entries, total: entries.length, sampleSize: entries.length });
  const [error, setError] = useState('');
  const pageSize = 10;

  useEffect(() => {
    let active = true;
    const params = { dimension, page, limit: pageSize, search, sort };
    if (dimension !== 'global' && filterValue.trim()) params.value = filterValue.trim();

    axios.get('/api/leaderboards', { params })
      .then((response) => {
        if (active) {
          setData(response.data || { entries: [], total: 0, sampleSize: 0 });
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Leaderboard data is temporarily unavailable.');
      });

    return () => { active = false; };
  }, [dimension, filterValue, page, search, sort]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const maxPages = Math.max(1, Math.ceil((data.total || 0) / pageSize));
  const displayEntries = data.entries || entries;
  return (
    <div className="mini-panel leaderboard-panel">
      <div className="panel-header">
        <h3>{DIMENSIONS.find(([key]) => key === dimension)?.[1] || 'Global ELO'}</h3>
        <span className="chip">{data.sampleSize || 0} profiles</span>
      </div>

      <div className="leaderboard-filters">
        <label>
          <span>Rank by</span>
          <select value={dimension} onChange={(event) => { setDimension(event.target.value); setFilterValue(''); setPage(1); }}>
            {DIMENSIONS.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>Sort by</span>
          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="generalElo">Global Career ELO</option>
          </select>
        </label>
        {dimension !== 'global' ? (
          <label>
            <span>Filter {dimension === 'ageGroup' ? 'age group' : dimension}</span>
            <input value={filterValue} onChange={(event) => { setFilterValue(event.target.value); setPage(1); }} placeholder="Optional exact filter" />
          </label>
        ) : null}
        <form onSubmit={submitSearch} className="leaderboard-search">
          <label>
            <span>Search career profiles</span>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search profiles" />
          </label>
          <button className="secondary-button" type="submit">Search</button>
        </form>
      </div>

      {error ? <p className="error-message">{error}</p> : null}
      {displayEntries.length ? (
        <div className="leaderboard-list">
          {displayEntries.map((entry, index) => (
            <div className="leaderboard-row" key={`${entry.username || index}-${entry.role}`}>
              <div className="leaderboard-person">
                <span>#{entry.rank || index + 1} @{entry.username || 'candidate'}</span>
                <small>{entry.prestigeTitles?.find((title) => title.includes('Global')) || 'Career profile'}</small>
              </div>
              <strong>{entry.generalElo ?? entry.globalElo} ELO</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted-note">No profiles in this leaderboard yet. Rankings grow as real profiles are added.</p>
      )}

      <div className="leaderboard-pagination">
        <button type="button" className="secondary-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
        <span>Page {page} of {maxPages}</span>
        <button type="button" className="secondary-button" disabled={page >= maxPages} onClick={() => setPage((current) => current + 1)}>Next</button>
      </div>
    </div>
  );
}
