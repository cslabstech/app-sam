# Best Practices Guide - SAM App

## 📋 Ringkasan
Panduan ini menjelaskan best practices yang telah diterapkan pada aplikasi SAM untuk memastikan kode production-ready, mudah dipahami developer beginner, dan mudah di-maintain.

## 🏗️ Arsitektur Aplikasi

### 1. **Struktur Folder** ✅
```
app/          → Screens (UI only, navigasi, panggil hooks)
components/   → UI components (atomic, reusable, no logic)
hooks/        → Custom hooks (fetch/update/transform data)
context/      → Global state (auth, theme, network)
constants/    → Style constants (colors, spacing, typography)
assets/       → Gambar, fonts, static files
docs/         → Dokumentasi
utils/        → Helper functions
```

### 2. **Separation of Concerns** ✅

#### Screens (`app/`)
- **HANYA** untuk UI, navigasi, dan pemanggilan hooks
- **TIDAK BOLEH** fetch/update data langsung
- Menggunakan context untuk global state
- Contoh: `app/(tabs)/index.tsx` menggunakan `useHomeData()` hook

#### Components (`components/`)
- **HANYA** untuk UI kecil, atomic, dan reusable
- **TIDAK BOLEH** ada logic fetch/mutasi
- Data hanya lewat props/context
- Contoh: `Button.tsx`, `Card.tsx`, `Input.tsx`

#### Hooks (`hooks/`)
- **SEMUA** fetch/update/transform data wajib di custom hook
- Hook harus UI-agnostic dan reusable
- Handle loading, error, dan success state
- Gunakan try/catch untuk async operations
- Contoh: `useHomeData.ts`, `useErrorHandler.ts`

## 🎨 Styling Best Practices

### 1. **Menggunakan Constants** ✅
```typescript
// ❌ JANGAN seperti ini
style={{ backgroundColor: '#FF8800', padding: 16 }}

// ✅ LAKUKAN seperti ini
style={{ backgroundColor: colors.primary, padding: spacing.lg }}
```

### 2. **Dynamic Theming** ✅
```typescript
const colorScheme = useColorScheme();
const colors = Colors[colorScheme ?? 'light'];
```

### 3. **Typography & Spacing** ✅
```typescript
// Gunakan constants untuk konsistensi
fontSize: typography.fontSize.md,
fontFamily: typography.fontFamily,
margin: spacing.lg,
padding: spacing.md,
```

## 🔄 Data Management

### 1. **Custom Hooks Pattern** ✅
```typescript
// Contoh hook yang baik
export function useHomeData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getData();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
}
```

### 2. **Error Handling** ✅
- Menggunakan `useErrorHandler` hook untuk konsistensi
- Logging semua error untuk debugging
- Format error message yang user-friendly
- Handle berbagai jenis error (network, API, validation)

### 3. **Loading States** ✅
- Selalu handle loading state di hooks
- Tampilkan loading indicator di UI
- Disable actions saat loading

## 🌐 Context Usage

### 1. **Global State Only** ✅
```typescript
// Gunakan context untuk:
- Authentication state
- Theme/color scheme
- Network connectivity
- Global settings

// JANGAN gunakan context untuk:
- Local component state
- Form data
- Temporary UI state
```

### 2. **Avoid Prop Drilling** ✅
```typescript
// ❌ Prop drilling
<Parent data={data}>
  <Child data={data}>
    <GrandChild data={data} />
  </Child>
</Parent>

// ✅ Context atau custom hook
const { data } = useGlobalData();
```

## 📝 Code Quality

### 1. **TypeScript** ✅
- Semua file menggunakan TypeScript
- Define interfaces untuk props dan data
- Avoid `any`, gunakan proper types

### 2. **Dokumentasi** ✅
```typescript
/**
 * Custom hook untuk menangani data di Home Screen
 * Mengikuti best practice: UI-agnostic, reusable, handle loading/error/success state
 */
export function useHomeData() {
  // Implementation...
}
```

### 3. **Naming Conventions** ✅
- File dan folder: kebab-case atau camelCase
- Components: PascalCase
- Hooks: camelCase dengan `use` prefix
- Constants: SCREAMING_SNAKE_CASE

## 🧪 Testing Considerations

### 1. **Component Testing**
- Test behavior, bukan implementation
- Mock hooks dan dependencies
- Test accessibility features

### 2. **Hook Testing**
- Test loading/error/success states
- Test callback functions
- Mock API calls

## 📱 Platform Considerations

### 1. **Responsive Design** ✅
- Gunakan Flexbox untuk layout
- Test di berbagai screen sizes
- Handle keyboard behavior

### 2. **Accessibility** ✅
```typescript
// Tambahkan accessibility props
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Login ke akun"
  accessibilityHint="Menekan tombol ini akan melakukan login"
>
```

### 3. **Performance** ✅
- Gunakan `useCallback` dan `useMemo` untuk optimasi
- Lazy loading untuk large lists
- Image optimization

## 🚀 Production Readiness

### 1. **Error Boundaries** 
```typescript
// Implement error boundaries untuk catch runtime errors
// Handle graceful degradation
```

### 2. **Logging** ✅
```typescript
import { log } from '@/utils/logger';

// Log untuk debugging dan monitoring
log('[CONTEXT]', 'Message with data', data);
```

### 3. **Environment Configuration**
```typescript
// Gunakan environment variables
const API_URL = process.env.EXPO_PUBLIC_BASE_URL;
```

## 🔄 Migration dari Legacy Code

Jika menemukan code yang belum mengikuti best practice:

1. **Pindahkan logic dari screen ke hooks**
2. **Replace hardcoded styles dengan constants**
3. **Tambahkan error handling dan loading states**
4. **Tambahkan dokumentasi**
5. **Implementasikan proper TypeScript types**

## 📚 Contoh Implementation

### Good Example: Home Screen
```typescript
// app/(tabs)/index.tsx
export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Logic ada di custom hook
  const { todayVisits, loading, error, refreshData } = useHomeData();
  
  return (
    <SafeAreaView style={{ backgroundColor: colors.background }}>
      {/* UI only */}
    </SafeAreaView>
  );
}
```

### Good Example: Custom Hook
```typescript
// hooks/useHomeData.ts
export function useHomeData() {
  const [todayVisits, setTodayVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const { handleError } = useErrorHandler();
  
  const fetchTodayVisits = useCallback(async () => {
    // Handle data fetching logic
  }, []);
  
  return { todayVisits, loading, refreshData: fetchTodayVisits };
}
```

---

## ✅ Checklist untuk Developer

Sebelum commit code, pastikan:

- [ ] Tidak ada hardcoded colors/spacing
- [ ] Logic data ada di hooks, bukan di screen/component
- [ ] Error handling sudah proper
- [ ] Loading states sudah dihandle
- [ ] TypeScript types sudah lengkap
- [ ] Dokumentasi/comment sudah ditambahkan
- [ ] Accessibility props sudah ditambahkan
- [ ] Test di iOS dan Android

---

## 📍 Fitur Check-in & Validasi Lokasi

### Validasi Radius Outlet
Sistem check-in memiliki fitur validasi lokasi yang fleksibel:

- **Radius > 0**: User harus berada dalam radius yang ditentukan (dalam meter)
- **Radius = 0**: Validasi lokasi dilewati (tidak ada batasan jarak)
- **Radius tidak ada**: Fallback ke MAX_DISTANCE (100m)

#### Implementasi di `app/livevisit/check-in.tsx`:
```typescript
// Jika radius outlet 0, skip validasi jarak (langsung valid)
if (selectedOutlet.radius === 0) {
  setLocationValidated(true);
} else {
  // Gunakan radius dari outlet, fallback ke MAX_DISTANCE
  const maxAllowedDistance = selectedOutlet.radius || MAX_DISTANCE;
  setLocationValidated(calculatedDistance <= maxAllowedDistance);
}
```

#### UI Feedback:
- Menampilkan status validasi lokasi dengan icon dan warna
- Jika radius = 0: "Validasi lokasi dilewati (radius tidak dibatasi)"
- Jika radius > 0: "Lokasi valid/terlalu jauh" dengan info jarak
- **Jika lokasi terlalu jauh**: Tombol "Update Lokasi Outlet" untuk navigasi ke edit outlet
- **Alert konfirmasi**: Ketika user mencoba lanjutkan tapi lokasi tidak valid, muncul alert dengan opsi update outlet

---

### Form Edit Outlet dengan Media Pickers & Hidden Location
Halaman edit outlet (`app/outlet/[id]/edit.tsx`) telah diupdate dengan fitur media picker:

#### Field yang Tersedia:
- **Code outlet**: Read-only, tidak bisa diubah
- **Location**: Hidden dari user, diambil otomatis dari GPS terkini di background
- **Owner name**: Required - Nama pemilik outlet
- **Owner phone**: Required - Nomor HP pemilik outlet
- **Photo shop sign**: Image picker untuk foto papan nama toko
- **Video**: Video picker untuk video outlet

#### Fitur Media Pickers:
- ✅ **Image picker**: Native gallery picker untuk foto shop sign
- ✅ **Video picker**: Native gallery picker untuk video outlet
- ✅ **Preview media**: Menampilkan preview foto dan info video yang dipilih
- ✅ **Remove option**: Tombol untuk menghapus media yang sudah dipilih
- ✅ **Permission handling**: Request permission untuk akses gallery

#### Fitur Auto Location (Hidden):
- ✅ **Background GPS**: Mengambil lokasi GPS terkini di background
- ✅ **User tidak tahu**: Field location tidak ditampilkan ke user
- ✅ **Auto-populate**: Location field terisi otomatis untuk payload API

#### UI/UX Features:
- ✅ **Picker buttons**: Tombol dengan style yang konsisten
- ✅ **Image preview**: Menampilkan preview gambar yang dipilih
- ✅ **Video info**: Menampilkan info nama file video
- ✅ **Remove buttons**: Easy removal untuk media yang tidak diinginkan

#### Payload API:
```typescript
const payload = {
  code: form.code,
  location: form.location,        // dari GPS background (hidden)
  owner_name: form.owner_name,    // required input
  owner_phone: form.owner_phone,  // required input
  photo_shop_sign: form.photo_shop_sign, // dari image picker
  video: form.video,              // dari video picker
};
```

---