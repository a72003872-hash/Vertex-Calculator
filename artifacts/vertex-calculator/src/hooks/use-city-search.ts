import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { z } from 'zod';

// Nominatim API Response Schema
const nominatimSchema = z.array(
  z.object({
    place_id: z.number(),
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
    type: z.string().optional(),
  })
);

export type CityResult = {
  id: number;
  name: string;
  lat: number;
  lon: number;
};

export function useCitySearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function searchCities() {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            debouncedQuery
          )}&featuretype=city,town,village&limit=5`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }

        const data = await response.json();
        
        // Safely parse the response
        const parsed = nominatimSchema.safeParse(data);
        
        if (!parsed.success) {
          console.error('[Zod] Nominatim validation failed:', parsed.error.format());
          throw new Error('Invalid data format from search service');
        }

        if (isMounted) {
          const formattedResults = parsed.data.map((item) => ({
            id: item.place_id,
            name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
          }));
          setResults(formattedResults);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setResults([]);
        }
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    }

    searchCities();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    clearResults: () => {
      setQuery('');
      setResults([]);
    }
  };
}
