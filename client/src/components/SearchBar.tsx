import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search tasks...", 
  className = "",
  delay = 500 
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        onSearch(searchQuery);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [searchQuery, delay, onSearch]);

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}
    </div>
  );
}
