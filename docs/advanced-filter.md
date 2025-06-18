# Advanced Filter Component

## Overview
Komponen `AdvancedFilter` adalah solusi UI untuk menampilkan filter tambahan yang dapat di-collapse/expand. Ini membantu mengatasi masalah filter yang memenuhi layar dan membuat tampilan data lebih efektif.

## Features
- **Collapsible UI**: Filter dapat di-hide/show dengan toggle button
- **Responsive Design**: Mengikuti theme colors dan responsif
- **Reusable Component**: Dapat digunakan di berbagai screen
- **Clean Interface**: Hanya menampilkan basic search, advanced filter tersembunyi

## Usage

### Basic Implementation
```tsx
import { AdvancedFilter } from '@/components/AdvancedFilter';

const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

<AdvancedFilter 
  showAdvancedFilter={showAdvancedFilter}
  onToggle={() => setShowAdvancedFilter(!showAdvancedFilter)}
>
  {/* Your filter controls here */}
  <YourFilterControls />
</AdvancedFilter>
```

### Implemented In
- `app/(tabs)/outlets.tsx` - Filter untuk outlets list
- `app/(tabs)/visits.tsx` - Filter untuk visits list

## UI Structure

### Before (Masalah)
```
┌─────────────────────────────┐
│ Search Input                │
├─────────────────────────────┤
│ Filter Tabs (All/Today/etc) │
├─────────────────────────────┤
│ Per Page Options            │
├─────────────────────────────┤
│ Sort Options                │
├─────────────────────────────┤
│ Status Info                 │
├─────────────────────────────┤
│ Data List (Sedikit space)   │
└─────────────────────────────┘
```

### After (Solusi)
```
┌─────────────────────────────┐
│ Search Input                │
├─────────────────────────────┤
│ [Advanced Filter ▼]         │
├─────────────────────────────┤
│ Status Info                 │
├─────────────────────────────┤
│ Data List (Lebih space)     │
│                             │
│                             │
└─────────────────────────────┘
```

### Advanced Filter Expanded
```
┌─────────────────────────────┐
│ Search Input                │
├─────────────────────────────┤
│ [Advanced Filter ▲]         │
│ ┌─────────────────────────┐ │
│ │ Filter Tabs             │ │ 
│ │ Per Page Options        │ │
│ │ Sort Options            │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Status Info                 │
├─────────────────────────────┤
│ Data List                   │
└─────────────────────────────┘
```

## Benefits
1. **Cleaner UI**: Lebih banyak space untuk data
2. **Better UX**: User dapat fokus pada data utama
3. **Flexible**: Advanced filter hanya muncul ketika diperlukan
4. **Modular**: Komponen dapat digunakan di berbagai screen
5. **Maintainable**: Separation of concerns yang baik

## Props
- `showAdvancedFilter: boolean` - State untuk show/hide advanced filter
- `onToggle: () => void` - Callback untuk toggle advanced filter
- `children: React.ReactNode` - Filter controls yang akan ditampilkan

## Styling
- Menggunakan consistent theme colors
- Responsive design dengan Flexbox
- Smooth transitions (dapat ditambahkan Animated untuk enhancement)
- Consistent spacing dengan design system

## Future Enhancements
- Tambahkan smooth animation dengan `Animated` API
- Add persistence untuk remember filter state
- Add reset filter functionality
- Add filter count indicator di button
