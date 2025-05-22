import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import SearchBar from './SearchBar';
import { CheckSquare } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [, setLocation] = useLocation();
  
  return (
    <header className="bg-white shadow">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex items-center">
          <CheckSquare className="text-primary mr-2 h-6 w-6" />
          <h1 className="text-xl font-semibold">TaskMaster</h1>
        </div>
        <div className="flex items-center">
          <div className="hidden md:block relative mr-4">
            <SearchBar onSearch={onSearch} className="w-64" />
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2 hidden sm:block">Ansh Goyal</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">AG</div>
          </div>
        </div>
      </div>
    </header>
  );
}
