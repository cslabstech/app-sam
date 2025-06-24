import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { useThemeStyles } from '@/hooks/utils/useThemeStyles';
import { AdvancedFilter } from './AdvancedFilter';
import { IconSymbol } from './ui/IconSymbol';
import { Select } from './ui/Select';

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

export function DateFilter({ onFilterChange, initialFilters }: DateFilterProps) {
  const { colors, styles } = useThemeStyles();
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>(initialFilters?.filterType || 'all');
  const [selectedMonth, setSelectedMonth] = useState(initialFilters?.month || '');
  const [selectedYear, setSelectedYear] = useState(initialFilters?.year || new Date().getFullYear().toString());
  const [selectedDate, setSelectedDate] = useState(initialFilters?.date ? new Date(initialFilters.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Use ref to prevent initial effect call
  const isInitialMount = useRef(true);
  const lastFiltersRef = useRef<string>('');

  // Memoized options to prevent unnecessary re-renders
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

  // Memoized year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => {
      const year = currentYear - 2 + i;
      return { label: year.toString(), value: year.toString() };
    });
  }, []);

  // Memoized date string to prevent unnecessary effect triggers
  const selectedDateString = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  // Create filter object and JSON string for comparison
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

  // Effect to emit filter changes - with proper dependencies
  useEffect(() => {
    // Skip initial mount or if filters haven't changed
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only call if filters actually changed
    if (lastFiltersRef.current !== currentFiltersString) {
      lastFiltersRef.current = currentFiltersString;
      
      // Only call onFilterChange if we have valid filters
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

  const handleFilterTypeChange = useCallback((newFilterType: 'all' | 'month' | 'date') => {
    setFilterType(newFilterType);
    
    // Auto-show advanced filter for month and date
    if (newFilterType !== 'all') {
      setShowAdvancedFilter(true);
    } else {
      setShowAdvancedFilter(false);
    }
    
    // Reset month when switching away from month filter
    if (newFilterType !== 'month') {
      setSelectedMonth('');
    }
    // Set default month to current month when switching to month filter
    else if (newFilterType === 'month' && !selectedMonth) {
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
      setSelectedMonth(currentMonth);
    }
  }, [selectedMonth]);

  const toggleAdvancedFilter = useCallback(() => {
    setShowAdvancedFilter(!showAdvancedFilter);
  }, [showAdvancedFilter]);

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Quick Filter Buttons */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <Pressable
          style={[
            {
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 20,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
            },
            filterType === 'all' 
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: 'transparent', borderColor: colors.border }
          ]}
          onPress={() => handleFilterTypeChange('all')}
        >
          <Text style={[
            { fontSize: 14, fontWeight: '500' },
            { color: filterType === 'all' ? colors.textInverse : colors.textSecondary }
          ]}>
            Semua
          </Text>
        </Pressable>

        <Pressable
          style={[
            {
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 20,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
            },
            filterType === 'month' 
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: 'transparent', borderColor: colors.border }
          ]}
          onPress={() => handleFilterTypeChange('month')}
        >
          <IconSymbol name="calendar" size={14} color={filterType === 'month' ? colors.textInverse : colors.textSecondary} />
          <Text style={[
            { fontSize: 14, fontWeight: '500', marginLeft: 4 },
            { color: filterType === 'month' ? colors.textInverse : colors.textSecondary }
          ]}>
            Bulan
          </Text>
        </Pressable>

        <Pressable
          style={[
            {
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 20,
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
            },
            filterType === 'date' 
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: 'transparent', borderColor: colors.border }
          ]}
          onPress={() => handleFilterTypeChange('date')}
        >
          <IconSymbol name="calendar.badge.clock" size={14} color={filterType === 'date' ? colors.textInverse : colors.textSecondary} />
          <Text style={[
            { fontSize: 14, fontWeight: '500', marginLeft: 4 },
            { color: filterType === 'date' ? colors.textInverse : colors.textSecondary }
          ]}>
            Tanggal
          </Text>
        </Pressable>

        {/* Reset Button - only show when filter is active */}
        {filterType !== 'all' && (
          <Pressable
            style={[
              {
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 20,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'transparent',
                borderColor: colors.textSecondary,
              }
            ]}
            onPress={handleReset}
          >
            <IconSymbol name="xmark" size={14} color={colors.textSecondary} />
            <Text style={[
              { fontSize: 14, fontWeight: '500', marginLeft: 4 },
              { color: colors.textSecondary }
            ]}>
              Reset
            </Text>
          </Pressable>
        )}
      </View>

      {/* Advanced Filter Options - only show when filter type is not 'all' */}
      {filterType !== 'all' && (
        <AdvancedFilter
          showAdvancedFilter={showAdvancedFilter}
          onToggle={toggleAdvancedFilter}
        >
          <View style={{ gap: 16, paddingTop: 8 }}>
            {filterType === 'month' && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 2 }}>
                  <Select
                    label="Bulan"
                    value={selectedMonth}
                    options={monthOptions}
                    onValueChange={setSelectedMonth}
                    placeholder="Pilih bulan"
                  />
                </View>
                <View style={{ flex: 1 }}>
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
                <Text style={[{ fontSize: 14, fontWeight: '500', marginBottom: 8 }, styles.text.primary]}>
                  Tanggal Spesifik
                </Text>
                <Pressable
                  style={[
                    {
                      borderRadius: 8,
                      borderWidth: 1,
                      padding: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderColor: colors.inputBorder,
                      backgroundColor: colors.input,
                    }
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconSymbol name="calendar" size={16} color={colors.primary} />
                    <Text style={[{ marginLeft: 8, fontSize: 14 }, styles.text.primary]}>
                      {formatDate(selectedDate)}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
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
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 12 }}>
                    <Pressable
                      style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }, styles.button.secondary]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={[{ fontWeight: '600' }, styles.text.primary]}>Batal</Text>
                    </Pressable>
                    <Pressable
                      style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }, styles.button.primary]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={[{ fontWeight: '600' }, styles.text.inverse]}>Selesai</Text>
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
} 