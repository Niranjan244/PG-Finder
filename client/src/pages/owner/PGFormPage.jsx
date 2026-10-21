import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createListingApi,
  updateListingApi,
  fetchOwnerListingById,
  uploadImagesApi,
  geocodeLocationApi,
} from '../../services/pgClient.js';
import {
  Building2,
  MapPin,
  Utensils,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  Check,
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';

const COMMON_AMENITIES = [
  'Air Conditioning',
  'High-Speed Wi-Fi',
  'Power Backup',
  'RO Drinking Water',
  'Washing Machine',
  'Geyser / Hot Water',
  'CCTV Surveillance',
  'Daily Housekeeping',
  'Attached Washroom',
  'Refrigerator',
  'Elevator',
  'Biometric Access',
];

const COMMON_RULES = [
  'Gate closing time: 10:30 PM',
  'Visitors allowed in common lobby only',
  'No smoking inside premises',
  'No alcoholic beverages allowed',
  'Quiet hours after 11:00 PM',
  'Notice period: 30 days before vacating',
];

const pgFormSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(2000),
  genderPreference: z.enum(['boys', 'girls', 'coliving']),
  deposit: z.coerce.number().min(0, 'Deposit cannot be negative'),
  city: z.string().trim().min(2, 'City is required'),
  area: z.string().trim().min(2, 'Area is required'),
  address: z.string().trim().min(5, 'Street address is required'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  foodAvailable: z.boolean().default(false),
  mealBreakfast: z.boolean().default(false),
  mealLunch: z.boolean().default(false),
  mealDinner: z.boolean().default(false),
  isPureVeg: z.boolean().default(false),
  wifi: z.boolean().default(false),
});

export const PGFormPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedRules, setSelectedRules] = useState([]);
  const [images, setImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [serverError, setServerError] = useState('');
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [geocodeNotice, setGeocodeNotice] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(pgFormSchema),
    defaultValues: {
      title: '',
      description: '',
      genderPreference: 'coliving',
      deposit: 5000,
      city: '',
      area: '',
      address: '',
      latitude: 12.9716, // Default Bangalore center coordinates
      longitude: 77.5946,
      foodAvailable: false,
      mealBreakfast: false,
      mealLunch: false,
      mealDinner: false,
      isPureVeg: false,
      wifi: true,
    },
  });

  const foodAvailable = watch('foodAvailable');

  const handleAutoGeocode = async () => {
    const cityVal = watch('city')?.trim();
    const areaVal = watch('area')?.trim();
    const addressVal = watch('address')?.trim();
    if (!cityVal && !areaVal) {
      setGeocodeNotice('Please enter City and Locality/Area first.');
      return;
    }
    const queryStr = [addressVal, areaVal, cityVal].filter(Boolean).join(', ');
    try {
      setIsGeocodingAddress(true);
      setGeocodeNotice('');
      const response = await geocodeLocationApi(queryStr);
      let suggestions = response?.data?.data?.suggestions || [];
      if (suggestions.length === 0 && areaVal && cityVal) {
        const fallbackRes = await geocodeLocationApi(`${areaVal}, ${cityVal}`);
        suggestions = fallbackRes?.data?.data?.suggestions || [];
      }
      if (suggestions.length === 0 && cityVal) {
        const cityRes = await geocodeLocationApi(cityVal);
        suggestions = cityRes?.data?.data?.suggestions || [];
      }
      if (suggestions.length > 0) {
        const top = suggestions[0];
        setValue('latitude', top.lat);
        setValue('longitude', top.lng);
        setGeocodeNotice(`Coordinates resolved: ${top.lat}, ${top.lng}`);
      } else {
        setGeocodeNotice('No GPS match found. You can enter coordinates manually.');
      }
    } catch (error) {
      setGeocodeNotice('Failed to resolve coordinates automatically.');
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  // Load existing data when editing
  useEffect(() => {
    if (isEditing) {
      const loadPG = async () => {
        try {
          const response = await fetchOwnerListingById(id);
          const pg = response.data.pg;

          setValue('title', pg.title);
          setValue('description', pg.description);
          setValue('genderPreference', pg.genderPreference);
          setValue('deposit', pg.deposit);
          setValue('city', pg.city);
          setValue('area', pg.area);
          setValue('address', pg.address);
          setValue('longitude', pg.location?.coordinates?.[0] || 77.5946);
          setValue('latitude', pg.location?.coordinates?.[1] || 12.9716);
          setValue('foodAvailable', Boolean(pg.foodDetails?.available));
          setValue('mealBreakfast', pg.foodDetails?.mealTypes?.includes('Breakfast') || false);
          setValue('mealLunch', pg.foodDetails?.mealTypes?.includes('Lunch') || false);
          setValue('mealDinner', pg.foodDetails?.mealTypes?.includes('Dinner') || false);
          setValue('isPureVeg', Boolean(pg.foodDetails?.isPureVeg));
          setValue('wifi', Boolean(pg.wifi));

          setSelectedAmenities(pg.amenities || []);
          setSelectedRules(pg.rules || []);
          setImages(pg.images || []);
        } catch (error) {
          setServerError(error.message || 'Failed to load accommodation data');
        } finally {
          setPageLoading(false);
        }
      };
      loadPG();
    }
  }, [id, isEditing, setValue]);

  const toggleAmenity = (item) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((amenity) => amenity !== item) : [...prev, item]
    );
  };

  const toggleRule = (item) => {
    setSelectedRules((prev) =>
      prev.includes(item) ? prev.filter((rule) => rule !== item) : [...prev, item]
    );
  };

  const handleImageFileChange = async (event) => {
    const inputElement = event.target;
    const files = Array.from(inputElement.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 10) {
      setServerError('Maximum 10 images allowed per listing.');
      inputElement.value = '';
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    setIsUploadingImages(true);
    setServerError('');
    try {
      const uploadResponse = await uploadImagesApi(formData);
      const newImages = uploadResponse.data?.images || uploadResponse.images || [];
      if (newImages.length === 0) {
        throw new Error('Upload succeeded but no image records were returned.');
      }
      setImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      setServerError(error.message || 'Image upload failed. Ensure images are JPEG/PNG/WebP under 10MB.');
    } finally {
      setIsUploadingImages(false);
      inputElement.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleStepClick = async (targetStep) => {
    if (targetStep > activeStep) {
      if (activeStep === 1 || targetStep > 1) {
        const step1Valid = await trigger(['title', 'description', 'genderPreference', 'deposit']);
        if (!step1Valid) {
          setServerError('Please fill in all required fields in Step 1 (title min 5 chars, description min 20 chars).');
          setActiveStep(1);
          return;
        }
      }
      if (activeStep === 2 || targetStep > 2) {
        const step2Valid = await trigger(['city', 'area', 'address', 'latitude', 'longitude']);
        if (!step2Valid) {
          setServerError('Please fill in city, area, and street address in Step 2 before continuing.');
          setActiveStep(2);
          return;
        }
      }
    }
    setServerError('');
    setActiveStep(targetStep);
  };

  const handleNextFromStep1 = async () => {
    const isValid = await trigger(['title', 'description', 'genderPreference', 'deposit']);
    if (isValid) {
      setServerError('');
      setActiveStep(2);
    } else {
      setServerError('Please fix the errors in Step 1 before continuing (title min 5 chars, description min 20 chars).');
    }
  };

  const handleNextFromStep2 = async () => {
    const isValid = await trigger(['city', 'area', 'address', 'latitude', 'longitude']);
    if (isValid) {
      setServerError('');
      setActiveStep(3);
    } else {
      setServerError('Please fill in city, area, and street address before continuing.');
    }
  };

  const onInvalid = (formErrors) => {
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const errorMsg = formErrors[firstKey]?.message || 'Please fill in all required fields';
      setServerError(`Validation error: ${errorMsg}`);

      // Auto-jump to the step containing the invalid field
      if (['title', 'description', 'genderPreference', 'deposit'].includes(firstKey)) {
        setActiveStep(1);
      } else if (['city', 'area', 'address', 'latitude', 'longitude'].includes(firstKey)) {
        setActiveStep(2);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (formData) => {
    setServerError('');

    const mealTypes = [];
    if (formData.foodAvailable) {
      if (formData.mealBreakfast) mealTypes.push('Breakfast');
      if (formData.mealLunch) mealTypes.push('Lunch');
      if (formData.mealDinner) mealTypes.push('Dinner');
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      genderPreference: formData.genderPreference,
      deposit: Number(formData.deposit) || 0,
      city: formData.city.trim(),
      area: formData.area.trim(),
      address: formData.address.trim(),
      latitude: Number(formData.latitude) || 12.9716,
      longitude: Number(formData.longitude) || 77.5946,
      foodDetails: {
        available: Boolean(formData.foodAvailable),
        mealTypes,
        isPureVeg: Boolean(formData.isPureVeg),
      },
      wifi: Boolean(formData.wifi),
      amenities: selectedAmenities,
      rules: selectedRules,
      images,
    };

    try {
      if (isEditing) {
        await updateListingApi(id, payload);
        navigate(`/owner/listings/${id}/rooms`);
      } else {
        const createResponse = await createListingApi(payload);
        const newPGId = createResponse.data?.pg?._id || createResponse.pg?._id || createResponse.data?._id || createResponse._id;
        if (newPGId) {
          navigate(`/owner/listings/${newPGId}/rooms`);
        } else {
          navigate('/owner/listings');
        }
      }
    } catch (error) {
      const errorMsg =
        error.errors && Array.isArray(error.errors)
          ? error.errors.map((errorItem) => errorItem.message).join(', ')
          : error.message || 'Failed to save accommodation listing.';
      setServerError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <Link
            to="/owner/listings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to My Listings</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isEditing ? 'Edit Accommodation Details' : 'List New PG Accommodation'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Submitting or editing a listing will flag it as <span className="font-semibold text-amber-700">Pending Verification</span> until administrator review.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Multi-step progress bar */}
      <div className="my-8">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          {[
            { step: 1, label: 'Basic Info', icon: Building2 },
            { step: 2, label: 'Location', icon: MapPin },
            { step: 3, label: 'Amenities', icon: Utensils },
            { step: 4, label: 'Photos', icon: ImageIcon },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => handleStepClick(item.step)}
              className={`flex flex-col items-center gap-1.5 rounded-lg p-2.5 transition-all ${
                activeStep === item.step
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-600'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        {/* Step 1: Basic Information */}
        {activeStep === 1 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Step 1: Property Overview</h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Accommodation Title
              </label>
              <input
                type="text"
                {...register('title')}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="e.g. Green Valley Luxury PG for Professionals"
              />
              {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Description
              </label>
              <textarea
                rows={4}
                {...register('description')}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Provide a detailed description of the building, security, atmosphere, and nearby landmarks..."
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Gender Category
                </label>
                <select
                  {...register('genderPreference')}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="boys">Boys Only</option>
                  <option value="girls">Girls Only</option>
                  <option value="coliving">Co-Living (Unisex)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Security Deposit (₹)
                </label>
                <input
                  type="number"
                  {...register('deposit')}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="5000"
                />
                {errors.deposit && <p className="mt-1 text-xs text-rose-600">{errors.deposit.message}</p>}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
              >
                <span>Continue to Location</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location Information */}
        {activeStep === 2 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Step 2: Location & Address</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  City
                </label>
                <input
                  type="text"
                  {...register('city')}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g. Bangalore"
                />
                {errors.city && <p className="mt-1 text-xs text-rose-600">{errors.city.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Locality / Area
                </label>
                <input
                  type="text"
                  {...register('area')}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g. Koramangala 4th Block"
                />
                {errors.area && <p className="mt-1 text-xs text-rose-600">{errors.area.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Detailed Street Address
              </label>
              <input
                type="text"
                {...register('address')}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Building No., Street, Landmark"
              />
              {errors.address && <p className="mt-1 text-xs text-rose-600">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('latitude')}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="12.9716"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('longitude')}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="77.5946"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleAutoGeocode}
                disabled={isGeocodingAddress}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-50 shadow-xs"
              >
                {isGeocodingAddress ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MapPin className="h-3.5 w-3.5" />
                )}
                <span>Auto-Detect Coordinates from Address</span>
              </button>
              {geocodeNotice && (
                <span className="text-[11px] text-brand-700 font-medium truncate max-w-sm">
                  {geocodeNotice}
                </span>
              )}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
              >
                <span>Continue to Amenities</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Amenities, Food & Rules */}
        {activeStep === 3 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <h2 className="text-base font-semibold text-slate-900">Step 3: Food, Amenities & Rules</h2>

            {/* Food Section */}
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Food & Meals Service</h3>
                  <p className="text-xs text-slate-500">Is home-cooked food provided at this accommodation?</p>
                </div>
                <input
                  type="checkbox"
                  {...register('foodAvailable')}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
              </div>

              {foodAvailable && (
                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('mealBreakfast')} className="rounded text-brand-600" />
                    <span>Breakfast</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('mealLunch')} className="rounded text-brand-600" />
                    <span>Lunch</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('mealDinner')} className="rounded text-brand-600" />
                    <span>Dinner</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('isPureVeg')} className="rounded text-brand-600" />
                    <span className="font-medium text-emerald-700">Pure Veg Only</span>
                  </label>
                </div>
              )}
            </div>

            {/* Amenities Grid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Available Amenities
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {COMMON_AMENITIES.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium text-left transition-colors ${
                        isChecked
                          ? 'border-brand-600 bg-brand-50/70 text-brand-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isChecked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* House Rules */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                House Guidelines & Rules
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COMMON_RULES.map((rule) => {
                  const isChecked = selectedRules.includes(rule);
                  return (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => toggleRule(rule)}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium text-left transition-colors ${
                        isChecked
                          ? 'border-brand-600 bg-brand-50/70 text-brand-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isChecked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{rule}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => handleStepClick(4)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
              >
                <span>Continue to Photos</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Photo Gallery & Final Submission */}
        {activeStep === 4 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Step 4: Accommodation Photographs</h2>
              <p className="mt-1 text-xs text-slate-500">
                Upload clear photos of rooms, building exterior, and common amenities (JPEG/PNG/WebP, max 5MB each).
              </p>
            </div>

            {/* Upload Zone */}
            <div className="relative rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-brand-500 transition-colors bg-slate-50/50">
              <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
              <div className="mt-3">
                <label className="cursor-pointer font-semibold text-brand-600 hover:text-brand-700 text-xs">
                  <span>Click to select photographs</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="sr-only"
                    disabled={isUploadingImages}
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">Up to 5 files per selection</p>
              </div>

              {isUploadingImages && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing & uploading photos...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Grid */}
            {images.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                  Uploaded Photos ({images.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={img.url + idx}
                      className="group relative h-28 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                    >
                      <img src={img.url} alt="Listing upload" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 rounded-full bg-slate-900/70 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        title="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg bg-amber-50 p-4 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Notice</p>
                <p className="mt-0.5 text-amber-700">
                  Upon saving, this accommodation listing will be submitted to the platform review queue. After submitting, you will be taken directly to the Room Management screen to configure room sharing and bed pricing.
                </p>
              </div>
            </div>

            {serverError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="pt-4 flex justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isUploadingImages}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Accommodation...</span>
                  </>
                ) : (
                  <>
                    <span>{isEditing ? 'Save Changes & Re-verify' : 'Create & Proceed to Rooms'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PGFormPage;
