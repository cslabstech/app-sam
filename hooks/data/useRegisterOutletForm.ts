import { router } from 'expo-router';
import { useState } from 'react';

type OutletType = 'Retail' | 'Store' | 'Distributor' | 'Other';

interface FormData {
  name: string;
  type: OutletType | '';
  address: string;
  contactName: string;
  contactPhone: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  type?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}

export function useRegisterOutletForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    address: '',
    contactName: '',
    contactPhone: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<OutletType | ''>('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const outletTypes: OutletType[] = ['Retail', 'Store', 'Distributor', 'Other'];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    if (errors[field as keyof FormErrors]) {
      setErrors({
        ...errors,
        [field]: undefined,
      });
    }
  };

  const handleTypeSelect = (type: OutletType) => {
    setSelectedType(type);
    setFormData({
      ...formData,
      type,
    });
    setShowTypeDropdown(false);
    if (errors.type) {
      setErrors({
        ...errors,
        type: undefined,
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Outlet name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Please select outlet type';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.contactPhone.replace(/[^0-9]/g, ''))) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        router.push('/(tabs)/outlets');
      }, 1500);
    }
  };

  // For production, ensure payload is snake_case
  const getPayload = () => ({
    name: formData.name,
    type: formData.type,
    address: formData.address,
    contact_name: formData.contactName,
    contact_phone: formData.contactPhone,
    notes: formData.notes,
  });

  return {
    formData,
    setFormData,
    errors,
    isSubmitting,
    selectedType,
    setSelectedType,
    showTypeDropdown,
    setShowTypeDropdown,
    outletTypes,
    handleInputChange,
    handleTypeSelect,
    handleSubmit,
    getPayload,
  };
}
