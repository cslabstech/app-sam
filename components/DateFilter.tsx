import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { AdvancedFilter } from './AdvancedFilter';
import { IconSymbol } from './ui/IconSymbol';
import { Select } from './ui/Select';

// 1. Types first
interface DateFilterProps {
  onFilterChange: (filters: {
    filterType: 'all' | 'month' | 'date';
    month?: string;
    year?: string;
    date?: string;
  }) => void;
  initialFilters?: {
    filterType: 'all' | 'month' | 'date';
    month?: string;
    year?: string;
    date?: string;
  };
}

type FilterType = 'all' | 'month' | 'date';

// 2. Custom hook for component logic
const useDateFilterLogic = ({ onFilterChange, initialFilters }: DateFilterProps) => {
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>(initialFilters?.filterType || 'all');
  const [selectedMonth, setSelectedMonth] = useState(initialFilters?.month || '');
  const [selectedYear, setSelectedYear] = useState(initialFilters?.year || new Date().getFullYear().toString());
  const [selectedDate, setSelectedDate] = useState(initialFilters?.date ? new Date(initialFilters.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const isInitialMount = useRef(true);
  const lastFiltersRef = useRef<string>('');

  // Memoized options
  const monthOptions = useMemo(() => [
    { label: 'Januari', value: '01' },
    { label: 'Februari', value: '02' },
    { label: 'Maret', value: '03' },
    { label: 'April', value: '04' },
    { label: 'Mei', value: '05' },
    { label: 'Juni', value: '06' },
    { label: 'Juli', value: '07' },
    { label: 'Agustus', value: '08' },
    { label: 'September', value: '09' },
    { label: 'Oktober', value: '10' },
    { label: 'November', value: '11' },
    { label: 'Desember', value: '12' },
  ], []);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => {
      const year = currentYear - 2 + i;
      return { label: year.toString(), value: year.toString() };
    });
  }, []);

  const selectedDateString = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const currentFilters = useMemo(() => {
    const filters = {
      filterType,
      ...(filterType === 'month' && selectedMonth && { month: selectedMonth, year: selectedYear }),
      ...(filterType === 'date' && { date: selectedDateString }),
    };
    return filters;
  }, [filterType, selectedMonth, selectedYear, selectedDateString]);

  const currentFiltersString = useMemo(() => {
    return JSON.stringify(currentFilters);
  }, [currentFilters]);

  // Filter change effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (lastFiltersRef.current !== currentFiltersString) {
      lastFiltersRef.current = currentFiltersString;
      
      if (filterType === 'all' || 
          (filterType === 'month' && selectedMonth && selectedYear) ||
          (filterType === 'date' && selectedDateString)) {
        onFilterChange(currentFilters);
      }
    }
  }, [currentFiltersString, onFilterChange, currentFilters, filterType, selectedMonth, selectedYear, selectedDateString]);

  const handleDateChange = useCallback((event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  const handleReset = useCallback(() => {
    setFilterType('all');
    setSelectedMonth('');
    setSelectedYear(new Date().getFullYear().toString());
    setSelectedDate(new Date());
    setShowAdvancedFilter(false);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const handleFilterTypeChange = useCallback((newFilterType: FilterType) => {
    setFilterType(newFilterType);
    
    if (newFilterType !== 'all') {
      setShowAdvancedFilter(true);
    } else {
      setShowAdvancedFilter(false);
    }
    
    if (newFilterType !== 'month') {
      setSelectedMonth('');
    } else if (newFilterType === 'month' && !selectedMonth) {
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
      setSelectedMonth(currentMonth);
    }
  }, [selectedMonth]);

  const toggleAdvancedFilter = useCallback(() => {
    setShowAdvancedFilter(!showAdvancedFilter);
  }, [showAdvancedFilter]);

  return {
    // State
    showAdvancedFilter,
    filterType,
    selectedMonth,
    selectedYear,
    selectedDate,
    showDatePicker,
    
    // Options
    monthOptions,
    yearOptions,
    
    // Handlers
    handleDateChange,
    handleReset,
    formatDate,
    handleFilterTypeChange,
    toggleAdvancedFilter,
    setSelectedMonth,
    setSelectedYear,
    setShowDatePicker,
  };
};

// 3. Main component
export const DateFilter = React.memo(function DateFilter({ 
  onFilterChange, 
  initialFilters 
}: DateFilterProps) {
  const colorScheme = useColorScheme();
  const {
    showAdvancedFilter,
    filterType,
    selectedMonth,
    selectedYear,
    selectedDate,
    showDatePicker,
    monthOptions,
    yearOptions,
    handleDateChange,
    handleReset,
    formatDate,
    handleFilterTypeChange,
    toggleAdvancedFilter,
    setSelectedMonth,
    setSelectedYear,
    setShowDatePicker,
  } = useDateFilterLogic({ onFilterChange, initialFilters });

  // ✅ PRIMARY - NativeWind classes
  const getContainerClasses = () => {
    return 'mb-4';
  };

  const getQuickFilterRowClasses = () => {
    return 'flex-row gap-2 mb-3';
  };

  const getFilterButtonClasses = (isActive: boolean) => {
    const baseClasses = [
      'py-2 px-3 rounded-full border',
      'flex-row items-center',
      'active:scale-95',
    ];

    if (isActive) {
      return [...baseClasses, 'bg-primary-500 border-primary-500'].join(' ');
    }
    return [...baseClasses, 'bg-transparent border-neutral-200 dark:border-neutral-600'].join(' ');
  };

  const getFilterButtonTextClasses = (isActive: boolean) => {
    const baseClasses = 'text-sm font-medium font-sans';
    
    if (isActive) {
      return `${baseClasses} text-white`;
    }
    return `${baseClasses} text-neutral-600 dark:text-neutral-400`;
  };

  const getFilterButtonTextWithIconClasses = (isActive: boolean) => {
    return `${getFilterButtonTextClasses(isActive)} ml-1`;
  };

  const getAdvancedFilterContentClasses = () => {
    return 'gap-4 pt-2';
  };

  const getMonthYearRowClasses = () => {
    return 'flex-row gap-3';
  };

  const getMonthSelectClasses = () => {
    return 'flex-[2]';
  };

  const getYearSelectClasses = () => {
    return 'flex-1';
  };

  const getDateSectionLabelClasses = () => {
    return 'text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-200 font-sans';
  };

  const getDatePickerButtonClasses = () => {
    return [
      'rounded-lg border border-neutral-300 dark:border-neutral-600',
      'p-3 flex-row items-center justify-between',
      'bg-white dark:bg-neutral-900',
      'active:bg-neutral-50 dark:active:bg-neutral-800',
    ].join(' ');
  };

  const getDatePickerContentClasses = () => {
    return 'flex-row items-center';
  };

  const getDatePickerTextClasses = () => {
    return 'ml-2 text-sm text-neutral-900 dark:text-white font-sans';
  };

  const getIOSButtonRowClasses = () => {
    return 'flex-row justify-end mt-3 gap-3';
  };

  const getIOSCancelButtonClasses = () => {
    return 'px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700';
  };

  const getIOSDoneButtonClasses = () => {
    return 'px-4 py-2 rounded-lg bg-primary-500 active:bg-primary-600';
  };

  const getIOSButtonTextClasses = (isDone = false) => {
    const baseClasses = 'font-semibold font-sans';
    return isDone 
      ? `${baseClasses} text-white` 
      : `${baseClasses} text-neutral-900 dark:text-white`;
  };

  return (
    <View className={getContainerClasses()}>
      {/* Quick Filter Buttons */}
      <View className={getQuickFilterRowClasses()}>
        <Pressable
          className={getFilterButtonClasses(filterType === 'all')}
          onPress={() => handleFilterTypeChange('all')}
          accessibilityRole="button"
          accessibilityLabel="Filter semua data"
        >
          <Text className={getFilterButtonTextClasses(filterType === 'all')}>
            Semua
          </Text>
        </Pressable>

        <Pressable
          className={getFilterButtonClasses(filterType === 'month')}
          onPress={() => handleFilterTypeChange('month')}
          accessibilityRole="button"
          accessibilityLabel="Filter berdasarkan bulan"
        >
          <IconSymbol 
            name="calendar" 
            size={14} 
            color={filterType === 'month' ? '#FFFFFF' : (colorScheme === 'dark' ? '#a3a3a3' : '#737373')} 
          />
          <Text className={getFilterButtonTextWithIconClasses(filterType === 'month')}>
            Bulan
          </Text>
        </Pressable>

        <Pressable
          className={getFilterButtonClasses(filterType === 'date')}
          onPress={() => handleFilterTypeChange('date')}
          accessibilityRole="button"
          accessibilityLabel="Filter berdasarkan tanggal"
        >
          <IconSymbol 
            name="calendar.badge.clock" 
            size={14} 
            color={filterType === 'date' ? '#FFFFFF' : (colorScheme === 'dark' ? '#a3a3a3' : '#737373')} 
          />
          <Text className={getFilterButtonTextWithIconClasses(filterType === 'date')}>
            Tanggal
          </Text>
        </Pressable>

        {/* Reset Button */}
        {filterType !== 'all' && (
          <Pressable
            className="py-2 px-3 rounded-full border border-neutral-400 dark:border-neutral-500 bg-transparent flex-row items-center active:scale-95"
            onPress={handleReset}
            accessibilityRole="button"
            accessibilityLabel="Reset filter"
          >
            <IconSymbol 
              name="xmark" 
              size={14} 
              color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
            />
            <Text className="text-sm font-medium ml-1 text-neutral-600 dark:text-neutral-400 font-sans">
              Reset
            </Text>
          </Pressable>
        )}
      </View>

      {/* Advanced Filter Options */}
      {filterType !== 'all' && (
        <AdvancedFilter
          showAdvancedFilter={showAdvancedFilter}
          onToggle={toggleAdvancedFilter}
        >
          <View className={getAdvancedFilterContentClasses()}>
            {filterType === 'month' && (
              <View className={getMonthYearRowClasses()}>
                <View className={getMonthSelectClasses()}>
                  <Select
                    label="Bulan"
                    value={selectedMonth}
                    options={monthOptions}
                    onValueChange={setSelectedMonth}
                    placeholder="Pilih bulan"
                  />
                </View>
                <View className={getYearSelectClasses()}>
                  <Select
                    label="Tahun"
                    value={selectedYear}
                    options={yearOptions}
                    onValueChange={setSelectedYear}
                    placeholder="Tahun"
                  />
                </View>
              </View>
            )}

            {filterType === 'date' && (
              <View>
                <Text className={getDateSectionLabelClasses()}>
                  Tanggal Spesifik
                </Text>
                <Pressable
                  className={getDatePickerButtonClasses()}
                  onPress={() => setShowDatePicker(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Pilih tanggal"
                >
                  <View className={getDatePickerContentClasses()}>
                    <IconSymbol 
                      name="calendar" 
                      size={16} 
                      color="#FF6B35" 
                    />
                    <Text className={getDatePickerTextClasses()}>
                      {formatDate(selectedDate)}
                    </Text>
                  </View>
                  <IconSymbol 
                    name="chevron.right" 
                    size={16} 
                    color={colorScheme === 'dark' ? '#a3a3a3' : '#737373'} 
                  />
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                  />
                )}

                {Platform.OS === 'ios' && showDatePicker && (
                  <View className={getIOSButtonRowClasses()}>
                    <Pressable
                      className={getIOSCancelButtonClasses()}
                      onPress={() => setShowDatePicker(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Batal pilih tanggal"
                    >
                      <Text className={getIOSButtonTextClasses()}>
                        Batal
                      </Text>
                    </Pressable>
                    <Pressable
                      className={getIOSDoneButtonClasses()}
                      onPress={() => setShowDatePicker(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Selesai pilih tanggal"
                    >
                      <Text className={getIOSButtonTextClasses(true)}>
                        Selesai
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </View>
        </AdvancedFilter>
      )}
    </View>
  );
});

// 4. Export types for reuse
export type { DateFilterProps, FilterType };
