import React, { useState, useRef, useEffect } from 'react';
import { useCitySearch, CityResult } from '@/hooks/use-city-search';
import { Input } from './ui-elements';
import { Loader2, MapPin, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string, lat: number, lon: number) => void;
  error?: string;
  disabled?: boolean;
}

export function CityAutocomplete({ value, onChange, error, disabled }: CityAutocompleteProps) {
  const { query, setQuery, results, isSearching, error: searchError } = useCitySearch();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(value);

  // Sync external value
  useEffect(() => {
    if (value !== displayValue && !isOpen) {
      setDisplayValue(value);
    }
  }, [value, isOpen, displayValue]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If they click away without selecting, revert to last confirmed value
        // or keep what they typed if we want to be lenient, but for lat/lon we need a selection.
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: CityResult) => {
    setDisplayValue(city.name);
    setQuery('');
    setIsOpen(false);
    onChange(city.name, city.lat, city.lon);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayValue(val);
    setQuery(val);
    setIsOpen(true);
    
    // If they clear the input, clear the selection
    if (val === '') {
       onChange('', 0, 0);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for your birth city..."
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length >= 3 || displayValue.length >= 3) {
              setIsOpen(true);
              if (displayValue && !query) setQuery(displayValue);
            }
          }}
          disabled={disabled}
          className={`pr-10 ${error ? 'border-destructive/50 focus:border-destructive focus:ring-destructive' : ''}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4 opacity-50" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (results.length > 0 || searchError) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl p-1 shadow-2xl overflow-hidden"
          >
            {searchError ? (
              <div className="p-4 text-sm text-destructive text-center">
                {searchError}
              </div>
            ) : (
              <ul className="max-h-60 overflow-y-auto py-1">
                {results.map((city) => (
                  <li key={city.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(city)}
                      className="w-full text-left px-4 py-3 text-sm text-foreground/80 hover:bg-white/10 hover:text-foreground rounded-lg transition-colors flex items-start gap-3"
                    >
                      <MapPin className="h-4 w-4 mt-0.5 opacity-50 shrink-0" />
                      <span className="line-clamp-2">{city.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
