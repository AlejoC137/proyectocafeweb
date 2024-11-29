import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import sourcer from './sources'; // Importar sourcer
import { scrapAction } from '../src/redux/actions';

const Scraper = () => {
  const dispatch = useDispatch();
  const scrapedData = useSelector((state) => state.scraperReducer?.scrapedData || {}); // Obtener datos del estado global

  const [sources, setSources] = useState([]); // Almacena todas las fuentes
  const [selectedSource, setSelectedSource] = useState(''); // Fuente seleccionada
  const [categories, setCategories] = useState([]); // Categorías de la fuente seleccionada
  const [selectedCategory, setSelectedCategory] = useState(''); // Categoría seleccionada
  const [loading, setLoading] = useState(false);

  // Cargar las fuentes al inicio
  useEffect(() => {
    const allSources = sourcer(); // Llamar sin parámetros para obtener todas las fuentes
    if (allSources) {
      setSources(allSources);
    }
  }, []);

  // Manejar el cambio de fuente seleccionada
  const handleSourceChange = (e) => {
    const sourceName = e.target.value;
    setSelectedSource(sourceName);

    // Encontrar las categorías de la fuente seleccionada
    const source = sources.find((s) => s.name === sourceName);
    if (source) {
      setCategories(source.sites);
    }
    setSelectedCategory(''); // Resetear la categoría seleccionada
  };

  // Manejar el cambio de categoría seleccionada
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // Manejar el scraping
  const handleScrap = async () => {
    if (!selectedSource || !selectedCategory) return;

    setLoading(true);

    // Llamar a sourcer con los valores seleccionados
    const sourceData = sourcer(selectedSource, selectedCategory);

    if (!sourceData) {
      console.error('No source data found for the selected source and category');
      setLoading(false);
      return;
    }

    const { url, target, pointers } = sourceData;

    // Ejecutar la acción con los valores obtenidos
    await dispatch(scrapAction(url, target, pointers));
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Scraper</h1>

      {/* Selector de fuente */}
      <label htmlFor="source">Select Source:</label>
      <select id="source" onChange={handleSourceChange} value={selectedSource}>
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
          <label htmlFor="category">Select Category:</label>
          <select id="category" onChange={handleCategoryChange} value={selectedCategory}>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.cat} value={category.cat}>
                {category.cat}
              </option>
            ))}
          </select>
        </>
      )}

      <button onClick={handleScrap} disabled={loading || !selectedCategory}>
        {loading ? 'Scraping...' : 'Scrap Data'}
      </button>

      <div style={{ marginTop: '20px' }}>
        {scrapedData && Object.keys(scrapedData).length > 0 ? (
          <pre>{JSON.stringify(scrapedData, null, 2)}</pre>
        ) : (
          !loading && <p>No data scraped yet. Select a source and category to start.</p>
        )}
      </div>
    </div>
  );
};

export default Scraper;
