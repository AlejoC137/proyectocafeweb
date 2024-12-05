import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import sourcer from './sources';
import { scrapAction } from '../src/redux/actions';

const Scraper = () => {
  const dispatch = useDispatch();
  const scrapedData = useSelector((state) => state.scraperReducer?.scrapedData || {});

  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const allSources = sourcer();
    if (allSources) setSources(allSources);
  }, []);

  const handleSourceChange = (e) => {
    const sourceName = e.target.value;
    setSelectedSource(sourceName);
    const source = sources.find((s) => s.name === sourceName);
    setCategories(source ? source.sites : []);
    setSelectedCategory('');
  };

  const handleScrap = async () => {
    if (!selectedSource || !selectedCategory) return;

    setLoading(true);
    setError('');

    try {
      const sourceData = sourcer(selectedSource, selectedCategory);
      if (!sourceData) throw new Error('Source data not found');
      const { url, target, pointers } = sourceData;
      await dispatch(scrapAction(url, target, pointers));
    } catch (err) {
      console.error(err.message);
      setError('Error fetching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-300 rounded-lg max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Scraper</h1>

      {/* Selector de fuente */}
      <label htmlFor="source" className="block mb-2 text-sm font-medium">
        Select Source:
      </label>
      <select
        id="source"
        onChange={handleSourceChange}
        value={selectedSource}
        className="block w-full p-2 border bg-slate-200 text-black border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:outline-none"
      >
        <option value="" disabled>
          Select a source
        </option>
        {sources.map((source) => (
          <option key={source.name} value={source.name}>
            {source.name}
          </option>
        ))}
      </select>

      {/* Selector de categoría */}
      {categories.length > 0 && (
        <>
          <label htmlFor="category" className="
          bg-white
          block mt-4 mb-2 text-sm font-medium">
            Select Category:
          </label>
          <select
            id="category"
            onChange={(e) => setSelectedCategory(e.target.value)}
            value={selectedCategory}
            className="block w-full p-2 bg-white border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:outline-none"
          >
            <option value="" disabled >
              Select a category
            </option>
            {categories.map((category) => (
              <option className='bg-slate-200 text-black' key={category.cat} value={category.cat}>
                {category.cat}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Botón para iniciar el scraping */}
      <button
        onClick={handleScrap}
        disabled={loading || !selectedCategory}
        className={`w-full mt-4 p-2 bg-slate-200 text-black font-medium rounded-md ${
          loading || !selectedCategory
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Scraping...' : 'Scrap Data'}
      </button>

      {/* Mostrar errores */}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {/* Mostrar datos obtenidos */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-md">
        {scrapedData && Object.keys(scrapedData).length > 0 ? (
          <pre className="text-sm text-gray-800">{JSON.stringify(scrapedData, null, 2)}</pre>
        ) : (
          !loading && <p className="text-gray-600">No data scraped yet. Select a source and category to start.</p>
        )}
      </div>
    </div>
  );
};

export default Scraper;
