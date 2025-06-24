import { useCallback, useRef, useState } from 'react';

interface FilterState {
  filterType: 'all' | 'month' | 'date';
  month?: string;
  year?: string;
  date?: string;
}

interface UseSafeFilterProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

/**
 * Custom hook untuk mengelola filter state dengan aman
 * Menghindari masalah useInsertionEffect dan state update timing issues
 */
export function useSafeFilter({ onFilterChange, initialFilters }: UseSafeFilterProps) {
  // State management yang lebih aman
  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>(
    initialFilters?.filterType || 'all'
  );
  const [selectedMonth, setSelectedMonth] = useState(
    initialFilters?.month || ''
  );
  const [selectedYear, setSelectedYear] = useState(
    initialFilters?.year || new Date().getFullYear().toString()
  );
  const [selectedDate, setSelectedDate] = useState(
    initialFilters?.date ? new Date(initialFilters.date) : new Date()
  );
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  // Refs untuk tracking dan preventing unnecessary calls
  const lastEmittedFilters = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced filter emission untuk mencegah multiple calls
  const emitFilters = useCallback((filters: FilterState) => {
    const filtersString = JSON.stringify(filters);
    
    // Hanya emit jika filters benar-benar berubah
    if (lastEmittedFilters.current === filtersString) {
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce untuk menghindari rapid fire calls
    timeoutRef.current = setTimeout(() => {
      lastEmittedFilters.current = filtersString;
      onFilterChange(filters);
    }, 100);
  }, [onFilterChange]);

  // Safe handlers yang tidak menyebabkan state conflicts
  const handleFilterTypeChange = useCallback((newType: 'all' | 'month' | 'date') => {
    setFilterType(newType);
    
    // Set advanced filter visibility
    if (newType !== 'all') {
      setShowAdvancedFilter(true);
    } else {
      setShowAdvancedFilter(false);
    }

    // Reset atau set default values
    let newMonth = selectedMonth;
    if (newType === 'month' && !selectedMonth) {
      newMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
      setSelectedMonth(newMonth);
    } else if (newType !== 'month') {
      setSelectedMonth('');
      newMonth = '';
    }

    // Emit filters after state updates
    setTimeout(() => {
      const filters: FilterState = { filterType: newType };
      
      if (newType === 'month' && newMonth) {
        filters.month = newMonth;
        filters.year = selectedYear;
      } else if (newType === 'date') {
        filters.date = selectedDate.toISOString().split('T')[0];
      }
      
      emitFilters(filters);
    }, 50);
  }, [selectedMonth, selectedYear, selectedDate, emitFilters]);

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
    
    if (filterType === 'month' && month && selectedYear) {
      setTimeout(() => {
        emitFilters({
          filterType: 'month',
          month,
          year: selectedYear
        });
      }, 50);
    }
  }, [filterType, selectedYear, emitFilters]);

  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year);
    
    if (filterType === 'month' && selectedMonth && year) {
      setTimeout(() => {
        emitFilters({
          filterType: 'month',
          month: selectedMonth,
          year
        });
      }, 50);
    }
  }, [filterType, selectedMonth, emitFilters]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    
    if (filterType === 'date') {
      setTimeout(() => {
        emitFilters({
          filterType: 'date',
          date: date.toISOString().split('T')[0]
        });
      }, 50);
    }
  }, [filterType, emitFilters]);

  const handleReset = useCallback(() => {
    setFilterType('all');
    setSelectedMonth('');
    setSelectedYear(new Date().getFullYear().toString());
    setSelectedDate(new Date());
    setShowAdvancedFilter(false);
    
    setTimeout(() => {
      emitFilters({ filterType: 'all' });
    }, 50);
  }, [emitFilters]);

  const toggleAdvancedFilter = useCallback(() => {
    setShowAdvancedFilter(prev => !prev);
  }, []);

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    // State
    filterType,
    selectedMonth,
    selectedYear,
    selectedDate,
    showAdvancedFilter,
    
    // Handlers
    handleFilterTypeChange,
    handleMonthChange,
    handleYearChange,
    handleDateChange,
    handleReset,
    toggleAdvancedFilter,
  };
} 