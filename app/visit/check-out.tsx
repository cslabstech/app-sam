import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { spacing } from '@/constants/Spacing';
import { typography } from '@/constants/Typography';
import { useVisit } from '@/hooks/data/useVisit';
import { useColorScheme } from '@/hooks/utils/useColorScheme';
import { useCurrentLocation } from '@/hooks/utils/useCurrentLocation';

interface Visit {
  id: string | number;
  outlet: {
    id: string | number;
    code: string;
    name: string;
    district?: string;
    owner_name: string;
    address: string;
    badan_usaha: { id: string | number; name: string; };
    division: { id: string | number; name: string; };
    region: { id: string | number; name: string; };
    cluster: { id: string | number; name: string; };
  };
}

interface CheckOutFormData {
  notes: string;
  transaction: 'YES' | 'NO' | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Terjadi kesalahan pada aplikasi.</Text>
          <Text style={styles.errorMessage}>Silakan tutup dan buka ulang aplikasi.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const useCheckOutForm = () => {
  const [formData, setFormData] = useState<CheckOutFormData>({
    notes: '',
    transaction: null,
  });

  const updateField = useCallback((field: keyof CheckOutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.notes.trim()) {
      Alert.alert('Catatan Wajib', 'Mohon isi catatan untuk check out.');
      return false;
    }
    if (!formData.transaction) {
      Alert.alert('Transaksi Wajib', 'Mohon pilih status transaksi.');
      return false;
    }
    return true;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      notes: '',
      transaction: null,
    });
  }, []);

  return {
    formData,
    updateField,
    validateForm,
    resetForm,
  };
};

const useCameraManager = () => {
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [hasCameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!hasCameraPermission || hasCameraPermission.status !== 'granted') {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Izin Kamera', 'Akses kamera diperlukan.');
        return false;
      }
    }
    return true;
  }, [hasCameraPermission, requestCameraPermission]);

  return {
    cameraRef,
    setCameraRef,
    hasCameraPermission,
    requestPermission,
    isCameraReady,
    setIsCameraReady,
    isFlashOn,
    setIsFlashOn,
    isProcessingPhoto,
    setIsProcessingPhoto,
  };
};

const Header = ({ onBack }: { onBack: () => void }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerContent}>
        <Pressable onPress={onBack} style={styles.backButton} accessibilityRole="button">
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Check Out</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>
    </View>
  );
};

const OutletInfoCard = ({ outlet }: { outlet: Visit['outlet'] }) => (
  <View style={styles.outletCard}>
    <Text style={styles.outletCardLabel}>Informasi Outlet</Text>
    <Text style={styles.outletName}>{outlet.name} ({outlet.code})</Text>
    <View style={styles.outletLocation}>
      <IconSymbol name="mappin.and.ellipse" size={18} color="#222B45" style={styles.locationIcon} />
      <Text style={styles.outletDistrict}>{outlet.district}</Text>
    </View>
  </View>
);

const TransactionSelector = ({ 
  selectedTransaction, 
  onTransactionChange 
}: { 
  selectedTransaction: 'YES' | 'NO' | null;
  onTransactionChange: (transaction: 'YES' | 'NO') => void;
}) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>Transaksi</Text>
    <View style={styles.transactionButtons}>
      <Pressable
        style={[
          styles.transactionButton,
          selectedTransaction === 'YES' && styles.transactionButtonActive
        ]}
        onPress={() => onTransactionChange('YES')}
        accessibilityRole="button"
      >
        <IconSymbol 
          name="checkmark.circle.fill" 
          size={20} 
          color={selectedTransaction === 'YES' ? '#fff' : '#FF8800'} 
        />
        <Text style={[
          styles.transactionButtonText,
          selectedTransaction === 'YES' && styles.transactionButtonTextActive
        ]}>
          YES
        </Text>
      </Pressable>
      
      <Pressable
        style={[
          styles.transactionButton,
          selectedTransaction === 'NO' && styles.transactionButtonActive
        ]}
        onPress={() => onTransactionChange('NO')}
        accessibilityRole="button"
      >
        <IconSymbol 
          name="xmark.circle.fill" 
          size={20} 
          color={selectedTransaction === 'NO' ? '#fff' : '#FF8800'} 
        />
        <Text style={[
          styles.transactionButtonText,
          selectedTransaction === 'NO' && styles.transactionButtonTextActive
        ]}>
          NO
        </Text>
      </Pressable>
    </View>
  </View>
);

const NotesInput = ({ 
  notes, 
  onNotesChange 
}: { 
  notes: string;
  onNotesChange: (notes: string) => void;
}) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>Catatan (Opsional)</Text>
    <TextInput
      style={styles.notesInput}
      placeholder="Tambahkan catatan untuk kunjungan ini..."
      placeholderTextColor="#7B8FA1"
      multiline
      value={notes}
      onChangeText={onNotesChange}
    />
  </View>
);

const CameraOverlay = ({ 
  hasCameraPermission,
  requestPermission,
  cameraRef,
  setCameraRef,
  isCameraReady,
  setIsCameraReady,
  isFlashOn,
  setIsFlashOn
}: {
  hasCameraPermission: any;
  requestPermission: () => Promise<boolean>;
  cameraRef: any;
  setCameraRef: (ref: any) => void;
  isCameraReady: boolean;
  setIsCameraReady: (ready: boolean) => void;
  isFlashOn: boolean;
  setIsFlashOn: (flash: boolean) => void;
}) => (
  <View style={styles.cameraContainer}>
    {hasCameraPermission?.status === 'granted' ? (
      <CameraView
        ref={(ref) => setCameraRef(ref)}
        style={styles.camera}
        onCameraReady={() => setIsCameraReady(true)}
        flash={isFlashOn ? 'on' : 'off'}
        facing="front"
      />
    ) : (
      <Pressable 
        onPress={requestPermission} 
        style={styles.cameraPermissionContainer} 
        accessibilityRole="button"
      >
        <IconSymbol name="camera.fill" size={60} color="#FF8800" />
        <Text style={styles.cameraPermissionText}>Izinkan akses kamera</Text>
      </Pressable>
    )}
    
    {hasCameraPermission?.status === 'granted' && (
      <Pressable 
        style={styles.flashButton} 
        onPress={() => setIsFlashOn(!isFlashOn)} 
        accessibilityRole="button"
      >
        <IconSymbol name={isFlashOn ? 'bolt.fill' : 'bolt.slash'} size={24} color="#FF8800" />
      </Pressable>
    )}
  </View>
);

const CheckOutForm = ({
  formData,
  updateField,
  onSubmit,
  isProcessing,
  isFormValid
}: {
  formData: CheckOutFormData;
  updateField: (field: keyof CheckOutFormData, value: any) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  isFormValid: boolean;
}) => (
  <View style={styles.formContainer}>
    <Text style={styles.formTitle}>Catatan & Transaksi</Text>
    
    <TransactionSelector
      selectedTransaction={formData.transaction}
      onTransactionChange={(transaction) => updateField('transaction', transaction)}
    />
    
    <NotesInput
      notes={formData.notes}
      onNotesChange={(notes) => updateField('notes', notes)}
    />
    
    <Pressable
      style={[
        styles.submitButton,
        (!isFormValid || isProcessing) && styles.submitButtonDisabled
      ]}
      onPress={onSubmit}
      disabled={!isFormValid || isProcessing}
      accessibilityRole="button"
    >
      <Text style={[
        styles.submitButtonText,
        (!isFormValid || isProcessing) && styles.submitButtonTextDisabled
      ]}>
        {isProcessing ? 'Memproses...' : 'Ambil Foto & Check Out'}
      </Text>
    </Pressable>
  </View>
);

const LoadingState = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat...</Text>
    </View>
  );
};

const ErrorState = ({ onBack }: { onBack: () => void }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
      <IconSymbol name="exclamationmark.triangle" size={60} color={colors.danger} />
      <Text style={[styles.errorStateTitle, { color: colors.text }]}>
        Data kunjungan tidak ditemukan.
      </Text>
      <Pressable 
        onPress={onBack} 
        style={styles.errorStateButton} 
        accessibilityRole="button"
      >
        <Text style={styles.errorStateButtonText}>Kembali</Text>
      </Pressable>
    </View>
  );
};

export default function CheckOutScreen() {
  const { id } = useLocalSearchParams();
  const visitId = typeof id === 'string' ? id : '';
  const { checkOutVisit, fetchVisit } = useVisit();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formManager = useCheckOutForm();
  const cameraManager = useCameraManager();
  const { location: currentLocation } = useCurrentLocation();

  useEffect(() => {
    async function fetchVisitDetail() {
      if (!visitId) return;
      setLoading(true);
      try {
        const res = await fetchVisit(visitId);
        if (res.success) {
          setVisit(res.data || null);
        } else {
          setVisit(null);
        }
      } catch (error) {
        console.error('Error fetching visit:', error);
        setVisit(null);
      } finally {
        setLoading(false);
      }
    }
    fetchVisitDetail();
  }, [visitId, fetchVisit]);

  const handleTakePhotoAndCheckOut = useCallback(async () => {
    if (!await cameraManager.requestPermission()) return;
    
    if (!cameraManager.cameraRef) {
      Alert.alert('Kamera tidak siap', 'Kamera belum siap digunakan.');
      return;
    }
    
    if (!visit?.outlet?.code) {
      Alert.alert('Outlet Error', 'Data outlet tidak valid. Silakan ulangi dari halaman utama.');
      return;
    }
    
    if (!formManager.validateForm()) return;

    cameraManager.setIsProcessingPhoto(true);
    
    try {
      let checkout_location = '';
      try {
        const loc = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced 
        });
        checkout_location = `${loc.coords.latitude},${loc.coords.longitude}`;
      } catch (e) {
        console.warn('Failed to get location:', e);
        checkout_location = '';
      }

      const photo = await cameraManager.cameraRef.takePictureAsync({ 
        quality: 0.7, 
        skipProcessing: true 
      });
      
      const manipulated = await ImageManipulator.manipulateAsync(photo.uri, [
        { resize: { width: 480 } },
        { flip: ImageManipulator.FlipType.Horizontal }
      ], { 
        compress: 0.5, 
        format: ImageManipulator.SaveFormat.JPEG 
      });

      const fileObj = {
        uri: manipulated.uri,
        name: `checkout-${Date.now()}.jpg`,
        type: 'image/jpeg',
      };

      const formData = new FormData();
      formData.append('checkout_location', checkout_location);
      formData.append('checkout_photo', fileObj as any);
      formData.append('transaction', formManager.formData.transaction!);
      formData.append('report', formManager.formData.notes);

      const res = await checkOutVisit(visitId, formData);
      
      if (res && res.meta && typeof res.meta.code === 'number') {
        if (res.meta.code === 200) {
          Alert.alert('Check Out Success', 'Data berhasil disimpan.');
          formManager.resetForm();
          router.back();
        } else {
          Alert.alert('Check Out Failed', res.meta.message || 'Gagal check out');
        }
      } else {
        Alert.alert('Check Out Failed', 'Respon server tidak valid.');
      }
    } catch (err) {
      console.error('Error checkout:', err);
      Alert.alert('Check Out Failed', 'Terjadi kesalahan saat mengirim data.');
    } finally {
      cameraManager.setIsProcessingPhoto(false);
    }
  }, [
    cameraManager,
    visit,
    formManager,
    checkOutVisit,
    visitId,
    router
  ]);

  useEffect(() => {
    return () => {
      formManager.resetForm();
    };
  }, [formManager.resetForm]);

  if (loading) {
    return <LoadingState />;
  }

  if (!loading && !visit) {
    return <ErrorState onBack={() => router.back()} />;
  }

  const isFormValid = formManager.formData.notes.trim() && formManager.formData.transaction;

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Header onBack={() => router.back()} />
        
        <OutletInfoCard outlet={visit!.outlet} />
        
        <View style={styles.content}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.cameraSection}>
                <CameraOverlay
                  hasCameraPermission={cameraManager.hasCameraPermission}
                  requestPermission={cameraManager.requestPermission}
                  cameraRef={cameraManager.cameraRef}
                  setCameraRef={cameraManager.setCameraRef}
                  isCameraReady={cameraManager.isCameraReady}
                  setIsCameraReady={cameraManager.setIsCameraReady}
                  isFlashOn={cameraManager.isFlashOn}
                  setIsFlashOn={cameraManager.setIsFlashOn}
                />
                
                <CheckOutForm
                  formData={formManager.formData}
                  updateField={formManager.updateField}
                  onSubmit={handleTakePhotoAndCheckOut}
                  isProcessing={cameraManager.isProcessingPhoto}
                  isFormValid={!!isFormValid}
                />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#FF8800',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: typography.fontSize2xl,
    fontWeight: 'bold',
  },
  headerPlaceholder: {
    width: 22,
    height: 22,
  },
  outletCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  outletCardLabel: {
    fontSize: typography.fontSizeSm,
    color: '#94a3b8',
    marginBottom: 4,
  },
  outletName: {
    color: '#FF8800',
    fontSize: typography.fontSizeLg,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  outletLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationIcon: {
    marginRight: 8,
  },
  outletDistrict: {
    color: '#FF8800',
    fontSize: typography.fontSizeMd,
  },
  content: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  cameraSection: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraPermissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  cameraPermissionText: {
    color: '#fff',
    fontSize: typography.fontSizeLg,
    marginTop: spacing.md,
  },
  flashButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.md,
  },
  formTitle: {
    fontSize: typography.fontSizeLg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: '#FF8800',
  },
  sectionContainer: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizeMd,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FF8800',
  },
  transactionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  transactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  transactionButtonActive: {
    backgroundColor: '#FF8800',
  },
  transactionButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#FF8800',
  },
  transactionButtonTextActive: {
    color: '#fff',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    minHeight: 80,
    color: '#FF8800',
    textAlignVertical: 'top',
  },
  submitButton: {
    width: '100%',
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8800',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: typography.fontSizeMd,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonTextDisabled: {
    color: '#6b7280',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizeMd,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: typography.fontSizeLg,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  errorMessage: {
    fontSize: typography.fontSizeMd,
    color: '#6b7280',
    marginTop: 8,
  },
  errorStateTitle: {
    fontSize: typography.fontSizeLg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  errorStateButton: {
    marginTop: spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF8800',
    borderRadius: 6,
  },
  errorStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});