import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Sparkles, BookOpen, Star, RotateCcw } from 'lucide-react';
import api from '../api/client';
import { ISkillListing, ISkillCategory } from '../types';
import { SkillCard } from '../components/SkillCard';

export const ExploreSkillsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [listings, setListings] = useState<ISkillListing[]>([]);
  const [categories, setCategories] = useState<ISkillCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || 'All');
  const [maxCredits, setMaxCredits] = useState<number>(Number(searchParams.get('maxCredits')) || 100);
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get('minRating')) || 0);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedLevel, maxCredits, minRating, sortBy]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        sort: sortBy,
        limit: 24,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedLevel && selectedLevel !== 'All') params.level = selectedLevel;
      if (maxCredits < 100) params.maxCredits = maxCredits;
      if (minRating > 0) params.minRating = minRating;

      const res = await api.get('/skills', { params });
      if (res.data.success) {
        setListings(res.data.listings);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedLevel('All');
    setMaxCredits(100);
    setMinRating(0);
    setSortBy('popular');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-stone-950 text-stone-100">
      {/* Page Header */}
      <div className="border-b-2 border-black pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 retro-chip font-pixel text-[8px] sm:text-[9px] bg-stone-800 text-amber-300 border border-black mb-2 shadow-sm">
          <span>👾</span>
          <span>CO-OP SKILL BOARD // ALL REALMS</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-pixel text-amber-300 tracking-wide">EXPLORE SKILL QUESTS</h1>
        <p className="font-retro-mono text-xs text-stone-400 mt-1">
          Connect with peer mentors across the network. Stake skill coins to unlock 1-on-1 matches.
        </p>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="retro-card bg-stone-900 border-2 border-black p-4 shadow-[4px_4px_0px_#000] space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skill, tech, or tag (e.g. React, Python, Figma, Game Dev)..."
              className="w-full pl-9 pr-4 py-2 text-xs font-retro-mono rounded-none border-2 border-black bg-stone-950 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            className="retro-btn font-pixel text-[9px] px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold"
          >
            SEARCH
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 font-retro-mono text-xs border-t-2 border-black">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 border-2 border-black bg-stone-950 text-stone-200 font-retro-mono text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-2.5 py-1.5 border-2 border-black bg-stone-950 text-stone-200 font-retro-mono text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Min Rating Filter */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-2.5 py-1.5 border-2 border-black bg-stone-950 text-stone-200 font-retro-mono text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="0">Any Rating</option>
              <option value="4.5">★ 4.5 & up</option>
              <option value="4.8">★ 4.8 & up</option>
              <option value="5.0">★ 5.0 (Top rated)</option>
            </select>

            {/* Max Credits Selector */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 border-2 border-black bg-stone-950 text-stone-300">
              <span className="text-[11px] text-stone-400">Max Bounty:</span>
              <span className="font-pixel text-[9px] text-amber-400">🪙 {maxCredits}</span>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={maxCredits}
                onChange={(e) => setMaxCredits(Number(e.target.value))}
                className="w-16 accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-400 text-xs">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 border-2 border-black bg-stone-950 text-stone-200 font-retro-mono text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="credits-asc">Bounty: Low to High</option>
              <option value="credits-desc">Bounty: High to Low</option>
              <option value="newest">Newest Quests</option>
            </select>

            <button
              onClick={resetFilters}
              title="Reset Filters"
              className="retro-btn p-1.5 bg-stone-800 text-stone-400 hover:text-white"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between font-retro-mono text-xs text-stone-400">
        <span>SHOWING {listings.length} OF {totalCount} ACTIVE SKILL QUESTS</span>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 retro-card bg-stone-900 border-2 border-black animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="p-10 text-center retro-card bg-stone-900 border-2 border-black space-y-3 shadow-[4px_4px_0px_#000]">
          <BookOpen size={32} className="mx-auto text-stone-500" />
          <h3 className="font-pixel text-xs text-stone-300">NO SKILL QUESTS FOUND</h3>
          <p className="font-retro-mono text-xs text-stone-400 max-w-sm mx-auto">
            Try adjusting your search criteria or resetting filters to see more offerings.
          </p>
          <button
            onClick={resetFilters}
            className="retro-btn font-pixel text-[9px] px-4 py-2 bg-amber-400 text-black font-bold"
          >
            RESET ALL FILTERS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <SkillCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
};