import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPublicPGApi } from '../../services/pgClient.js';
import { startConversationApi } from '../../services/chatClient.js';
import { fetchWishlistIdsApi, toggleWishlistApi } from '../../services/wishlistClient.js';
import {
  fetchPGReviewsApi,
  fetchReviewEligibilityApi,
  submitReviewApi,
} from '../../services/reviewClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { BookingModal } from '../../components/booking/BookingModal.jsx';
import {
  Building2,
  MapPin,
  Utensils,
  Wifi,
  ShieldCheck,
  Check,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  Share2,
  Calendar,
  MessageSquare,
  Heart,
  Star,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export const PGDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingRoom, setSelectedBookingRoom] = useState(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const [searchParams] = useSearchParams();
  const searchLat = parseFloat(searchParams.get('lat'));
  const searchLng = parseFloat(searchParams.get('lng'));
  const hasSearchCoords = !isNaN(searchLat) && !isNaN(searchLng);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // 1. Fetch Accommodation Details
  const { data: pgDetailsData, isLoading, isError, error } = useQuery({
    queryKey: ['publicPGDetails', id],
    queryFn: () => fetchPublicPGApi(id),
  });

  const pg = pgDetailsData?.data?.pg;
  const rooms = pgDetailsData?.data?.rooms || [];
  const isPreview = pgDetailsData?.data?.isPreview;

  const isOwner = Boolean(
    user &&
    pg?.owner &&
    (user.id === pg.owner._id || user._id === pg.owner._id || user.id === pg.owner || user._id === pg.owner)
  );
  const isOwnerRole = Boolean(user && (user.role === 'owner' || user.role === 'admin'));

  // 2. Fetch Wishlist Status
  const { data: wishlistData } = useQuery({
    queryKey: ['userWishlistIds'],
    queryFn: fetchWishlistIdsApi,
    enabled: Boolean(isAuthenticated),
    staleTime: 60000,
  });

  const isWishlisted = Boolean(wishlistData?.data?.wishlistIds?.includes(id));

  // 3. Fetch Reviews
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['pgReviews', id],
    queryFn: () => fetchPGReviewsApi(id),
  });

  const reviews = reviewsData?.data?.reviews || [];
  const totalReviewsCount = reviewsData?.data?.pagination?.total ?? pg?.reviewCount ?? 0;

  // 4. Fetch Tenant Review Eligibility
  const { data: eligibilityData } = useQuery({
    queryKey: ['reviewEligibility', id],
    queryFn: () => fetchReviewEligibilityApi(id),
    enabled: Boolean(isAuthenticated && !isOwner),
  });

  const canReview = Boolean(eligibilityData?.data?.canReview);
  const existingReview = eligibilityData?.data?.existingReview || null;

  // Pre-fill review form if tenant already submitted
  useEffect(() => {
    if (existingReview) {
      setReviewRating(existingReview.rating || 5);
      setReviewComment(existingReview.comment || '');
    }
  }, [existingReview]);

  // Smooth-scroll to hash anchor (e.g. #rooms)
  useEffect(() => {
    if (location.hash && !isLoading && pg) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [location.hash, isLoading, pg]);

  const calculatedDistanceKm = React.useMemo(() => {
    if (!hasSearchCoords || !pg?.location?.coordinates || pg.location.coordinates.length < 2) {
      return null;
    }
    const [pgLng, pgLat] = pg.location.coordinates;
    const R = 6371;
    const dLat = (pgLat - searchLat) * (Math.PI / 180);
    const dLon = (pgLng - searchLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(searchLat * (Math.PI / 180)) *
        Math.cos(pgLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }, [hasSearchCoords, searchLat, searchLng, pg?.location?.coordinates]);

  // Wishlist toggle handler
  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    try {
      setIsTogglingWishlist(true);
      await toggleWishlistApi(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userWishlistIds'] }),
        queryClient.invalidateQueries({ queryKey: ['userWishlist'] }),
      ]);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  // Review submission handler
  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      setReviewError('Review comment must be at least 5 characters long');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await submitReviewApi(id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewSuccess(existingReview ? 'Review updated successfully.' : 'Review submitted successfully.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pgReviews', id] }),
        queryClient.invalidateQueries({ queryKey: ['reviewEligibility', id] }),
        queryClient.invalidateQueries({ queryKey: ['publicPGDetails', id] }),
      ]);
    } catch (error) {
      setReviewError(error?.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    try {
      setIsStartingChat(true);
      const response = await startConversationApi(pg._id);
      const convId = response?.data?.conversation?._id;
      await queryClient.invalidateQueries({ queryKey: ['myConversations'] });
      if (convId) {
        navigate(`/chat?conversationId=${convId}`);
      } else {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleOpenBooking = (room = null) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setSelectedBookingRoom(room);
    setIsBookingModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (isError || !pg) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-theme-surface-subtle text-theme-muted">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-bold text-theme-primary">Accommodation Unavailable</h2>
        <p className="mt-1 text-xs text-theme-secondary max-w-sm mx-auto">
          {error?.message || 'This listing does not exist or has not been approved for public browsing yet.'}
        </p>
        <div className="mt-6">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Search</span>
          </Link>
        </div>
      </div>
    );
  }

  const images = pg.images || [];
  const primaryImage = images[selectedImageIndex]?.url || images[0]?.url;

  const getGenderLabel = (preference) => {
    switch (preference) {
      case 'boys':
        return 'Boys Accommodation';
      case 'girls':
        return 'Girls Accommodation';
      default:
        return 'Co-Living / Unisex';
    }
  };

  const getRoomTypeLabel = (roomType) => {
    switch (roomType) {
      case 'single':
        return 'Single Occupancy';
      case 'double':
        return 'Double Sharing';
      case 'triple':
        return 'Triple Sharing';
      case 'four_sharing':
        return 'Four Sharing';
      default:
        return roomType;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Verification / Preview Banner */}
      {isPreview && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-3">
          <Clock className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-700 dark:text-amber-300">Owner Preview Mode &bull; Pending Verification</span>
            <p className="mt-0.5 text-amber-600 dark:text-amber-400">
              This accommodation is currently undergoing administrator review and is not publicly discoverable in tenant search listings until approved.
            </p>
          </div>
        </div>
      )}

      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-theme-border">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-muted hover:text-theme-primary mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-theme-primary">{pg.title}</h1>
            <span className="rounded-full bg-theme-brand-subtle px-3 py-1 text-xs font-semibold text-theme-brand-text border border-theme-brand/20">
              {getGenderLabel(pg.genderPreference)}
            </span>

            {/* Rating pill */}
            <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              <span>{pg.averageRating > 0 ? Number(pg.averageRating).toFixed(1) : 'New'}</span>
              {pg.reviewCount > 0 && (
                <span className="font-normal text-amber-600 dark:text-amber-400">
                  ({pg.reviewCount} {pg.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-theme-secondary">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-theme-muted shrink-0" />
              <span>{pg.address}, {pg.area}, {pg.city}</span>
            </div>
            {calculatedDistanceKm !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-theme-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-theme-brand-text border border-theme-brand/20">
                <Navigation className="h-3 w-3" />
                <span>
                  {calculatedDistanceKm < 1
                    ? `${Math.round(calculatedDistanceKm * 1000)} m away`
                    : `${calculatedDistanceKm} km away`}
                </span>
              </span>
            )}
            {pg.location?.coordinates?.length === 2 && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${pg.location.coordinates[1]},${pg.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-theme-brand hover:underline"
              >
                <span>Get Directions &rarr;</span>
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist}
            className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-primary hover:bg-theme-surface-hover transition-colors shadow-xs"
          >
            {isTogglingWishlist ? (
              <Loader2 className="h-4 w-4 animate-spin text-theme-muted" />
            ) : (
              <Heart
                className={`h-4 w-4 ${
                  isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-theme-muted'
                }`}
              />
            )}
            <span>{isWishlisted ? 'Saved' : 'Save'}</span>
          </button>

          {/* Owner Manage Rooms shortcut */}
          {(isOwner || user?.role === 'admin') && (
            <Link
              to={`/owner/listings/${pg._id}/rooms`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3.5 py-2 text-xs font-semibold text-theme-primary hover:bg-theme-surface-hover transition-colors shadow-xs"
            >
              <span>Manage Rooms</span>
            </Link>
          )}
        </div>
      </div>

      {/* Media Gallery & Key Specs */}
      <div className="my-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Images */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative h-96 w-full overflow-hidden rounded-2xl border border-theme-border bg-theme-surface-subtle">
            {primaryImage ? (
              <img src={primaryImage} alt={pg.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-theme-muted">
                <Building2 className="h-12 w-12 stroke-[1.5]" />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.url + idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border transition-all ${
                    selectedImageIndex === idx
                      ? 'border-theme-brand ring-2 ring-theme-brand/30'
                      : 'border-theme-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Accommodation Quick Info Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xs">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Monthly Rent</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-theme-primary">
                {pg.rentRange?.minRent > 0
                  ? `₹${pg.rentRange.minRent.toLocaleString()}`
                  : 'On Request'}
              </span>
              {pg.rentRange?.maxRent > pg.rentRange?.minRent && (
                <span className="text-sm font-normal text-theme-secondary">
                  - ₹{pg.rentRange.maxRent.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-theme-muted">/ bed</span>
            </div>

            <div className="mt-6 space-y-3 border-t border-theme-border pt-5 text-xs text-theme-secondary">
              <div className="flex justify-between py-1 border-b border-theme-border-subtle">
                <span>Security Deposit:</span>
                <span className="font-semibold text-theme-primary">₹{pg.deposit?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme-border-subtle">
                <span>Notice Period:</span>
                <span className="font-semibold text-theme-primary">{pg.noticePeriodDays || 30} Days</span>
              </div>
              <div className="flex justify-between py-1 border-b border-theme-border-subtle">
                <span>Food Service:</span>
                <span className="font-semibold text-theme-primary">
                  {pg.foodDetails?.available ? 'Available' : 'Self-Cook / None'}
                </span>
              </div>
              {pg.foodDetails?.available && pg.foodDetails?.type && (
                <div className="flex justify-between py-1 border-b border-theme-border-subtle">
                  <span>Meal Type:</span>
                  <span className="font-semibold text-theme-primary capitalize">{pg.foodDetails.type}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span>Gate Closing Time:</span>
                <span className="font-semibold text-theme-primary">{pg.gateClosingTime || 'No curfew'}</span>
              </div>
            </div>

            {/* CTAs */}
            {isOwner ? (
              <div className="mt-5 pt-4 border-t border-theme-border">
                <Link
                  to={`/owner/listings/${pg._id}/rooms`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-theme-brand py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Manage Rooms & Pricing</span>
                </Link>
              </div>
            ) : isOwnerRole ? (
              <div className="mt-5 pt-4 border-t border-theme-border space-y-2.5">
                <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <p className="font-semibold">Owner Account Active</p>
                  <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                    To request room bookings, sign in with a Tenant account. You can still message this property manager.
                  </p>
                </div>
                {pg.status === 'approved' && (
                  <button
                    type="button"
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-theme-surface border border-theme-border py-2.5 text-xs font-semibold text-theme-primary shadow-xs hover:bg-theme-surface-hover transition-colors disabled:opacity-50"
                  >
                    {isStartingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin text-theme-brand" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-theme-brand" />
                    )}
                    <span>Chat with Owner</span>
                  </button>
                )}
              </div>
            ) : (
              pg.status === 'approved' && (
                <div className="mt-5 pt-4 border-t border-theme-border space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(null)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-theme-brand py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Request Booking</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-theme-surface border border-theme-border py-2.5 text-xs font-semibold text-theme-primary shadow-xs hover:bg-theme-surface-hover transition-colors disabled:opacity-50"
                  >
                    {isStartingChat ? (
                      <Loader2 className="h-4 w-4 animate-spin text-theme-brand" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-theme-brand" />
                    )}
                    <span>Chat with Owner</span>
                  </button>
                </div>
              )
            )}
          </div>

          {/* Owner Contact */}
          <div className="mt-6 pt-5 border-t border-theme-border bg-theme-surface-subtle -mx-6 -mb-6 p-6 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
                  Property Manager
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand-text font-bold text-xs">
                    {pg.owner?.name?.[0] || 'O'}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-theme-primary">{pg.owner?.name}</p>
                    <p className="text-theme-muted">{pg.owner?.phone}</p>
                  </div>
                </div>
              </div>
              {!isOwner && (
                <button
                  type="button"
                  onClick={handleStartChat}
                  disabled={isStartingChat}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold text-theme-primary hover:bg-theme-surface-hover transition-colors shadow-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-theme-brand" />
                  <span>Chat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="my-8 rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xs">
        <h2 className="text-base font-bold text-theme-primary mb-3">About this Accommodation</h2>
        <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-line">{pg.description}</p>
      </div>

      {/* Room Configurations Table */}
      <div id="rooms" className="my-8 rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xs transition-colors scroll-mt-20">
        <div className="flex items-center justify-between pb-4 border-b border-theme-border">
          <div>
            <h2 className="text-base font-bold text-theme-primary">Room Sharing Types & Pricing</h2>
            <p className="text-xs text-theme-muted">Live bed inventory for this accommodation</p>
          </div>
          {(isOwner || user?.role === 'admin') && (
            <Link
              to={`/owner/listings/${pg._id}/rooms`}
              className="text-xs font-semibold text-theme-brand hover:underline"
            >
              Edit Rooms
            </Link>
          )}
        </div>

        {rooms.length === 0 ? (
          <div className="py-8 text-center text-xs text-theme-muted">
            No rooms have been added to this accommodation yet.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map((room, idx) => {
              const availableBeds = Math.max(0, (room.totalBeds || 1) - (room.occupiedBeds || 0));
              const isRoomFull = availableBeds === 0;
              const canBook = !isOwner && !isOwnerRole && pg.status === 'approved' && !isRoomFull;

              return (
                <div
                  key={room._id}
                  onClick={() => {
                    if (canBook) {
                      handleOpenBooking(room);
                    }
                  }}
                  className={`rounded-xl border border-theme-border bg-theme-surface-subtle/50 p-4 text-xs flex flex-col justify-between transition-all ${
                    canBook ? 'cursor-pointer hover:border-theme-brand hover:shadow-md' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-theme-primary">{getRoomTypeLabel(room.roomType)}</span>
                      <span className="text-[11px] font-mono text-theme-muted">Room {room.roomNumber || idx + 1}</span>
                    </div>

                    <div className="mt-2 text-base font-bold text-theme-brand">
                      ₹{room.rent?.toLocaleString()}{' '}
                      <span className="text-[11px] font-normal text-theme-muted">/ month</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-theme-border space-y-1 text-theme-secondary">
                      <div className="flex justify-between">
                        <span>Total Capacity:</span>
                        <span className="font-semibold text-theme-primary">{room.totalBeds} Beds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Availability:</span>
                        <span
                          className={`font-semibold ${
                            availableBeds > 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {availableBeds > 0 ? `${availableBeds} Vacant` : 'Full'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isOwner && !isOwnerRole && pg.status === 'approved' && (
                    <div className="mt-3 pt-3 border-t border-theme-border">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBooking(room);
                        }}
                        disabled={isRoomFull}
                        className="w-full rounded-lg bg-theme-surface border border-theme-border py-1.5 text-xs font-semibold text-theme-primary hover:bg-theme-brand hover:text-white hover:border-theme-brand disabled:opacity-40 disabled:hover:bg-theme-surface disabled:hover:text-theme-muted transition-colors shadow-xs"
                      >
                        {isRoomFull ? 'Room Full' : 'Request This Room'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Amenities & Rules Grid */}
      <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Amenities */}
        <div className="rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xs">
          <h2 className="text-base font-bold text-theme-primary mb-4">Included Amenities</h2>
          {pg.amenities?.length === 0 ? (
            <p className="text-xs text-theme-muted">No amenities listed.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {pg.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 text-xs text-theme-secondary">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xs">
          <h2 className="text-base font-bold text-theme-primary mb-4">House Guidelines & Rules</h2>
          {pg.rules?.length === 0 ? (
            <p className="text-xs text-theme-muted">No specific house rules documented.</p>
          ) : (
            <div className="space-y-2">
              {pg.rules.map((rule) => (
                <div key={rule} className="flex items-start gap-2 text-xs text-theme-secondary">
                  <div className="h-1.5 w-1.5 rounded-full bg-theme-muted mt-1.5 shrink-0" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* Verified Resident Reviews & Ratings Section */}
      <div className="my-8 rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-theme-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-theme-primary">Verified Resident Reviews</h2>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified Stays Only</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-theme-secondary">
              Honest ratings from verified residents with confirmed bookings.
            </p>
          </div>

          {/* Rating Summary Card */}
          <div className="flex items-center gap-3 bg-theme-surface-subtle rounded-xl px-4 py-2.5 border border-theme-border">
            <div className="text-2xl font-extrabold text-theme-primary">
              {pg.averageRating > 0 ? Number(pg.averageRating).toFixed(1) : 'New'}
            </div>
            <div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${
                      s <= Math.round(pg.averageRating || 0)
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-theme-border'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-theme-muted">
                {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
        </div>

        {/* Review Submission or Eligibility Status */}
        {isAuthenticated ? (
          isOwner ? (
            <div className="rounded-xl border border-theme-border bg-theme-surface-subtle p-4 text-xs text-theme-secondary flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-theme-muted shrink-0" />
              <span>You are the manager of this property. Property managers cannot review their own listing.</span>
            </div>
          ) : canReview ? (
            <form onSubmit={handleSubmitReview} className="rounded-xl border border-theme-brand/30 bg-theme-brand-subtle/10 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-theme-primary">
                    {existingReview ? 'Update Your Review' : 'Write a Verified Resident Review'}
                  </h3>
                  <p className="text-[11px] text-theme-secondary">
                    Share your experience living at this PG to help prospective residents.
                  </p>
                </div>

                {/* Interactive Star Picker */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                      title={`${star} Star`}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-theme-border'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-1 text-xs font-bold text-theme-primary">{reviewRating}/5</span>
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details regarding food quality, room cleanliness, maintenance, and host hospitality..."
                  className="w-full rounded-lg border border-theme-border bg-theme-surface p-3 text-xs text-theme-primary shadow-xs focus:border-theme-brand focus:outline-none focus:ring-1 focus:ring-theme-brand transition-colors placeholder:text-theme-muted"
                  required
                />
              </div>

              {reviewError && (
                <div className="rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {reviewError}
                </div>
              )}

              {reviewSuccess && (
                <div className="rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {reviewSuccess}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="inline-flex items-center gap-2 rounded-lg bg-theme-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors disabled:opacity-50"
                >
                  {isSubmittingReview && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-theme-border bg-theme-surface-subtle p-4 text-xs text-theme-secondary flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-theme-brand shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-theme-primary">Anti-Fraud Protection: Verified Stays Only</p>
                <p className="mt-0.5 text-theme-secondary">
                  Only tenants with an approved booking request can write a review for this property. If you stay here, request a booking through the platform to unlock resident reviews.
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="rounded-xl border border-theme-border bg-theme-surface-subtle p-4 text-xs text-theme-secondary flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-theme-muted" />
              <span>Are you a resident of this PG? Log in to leave a verified review.</span>
            </div>
            <Link
              to="/login"
              state={{ from: location.pathname }}
              className="font-semibold text-theme-brand hover:underline"
            >
              Sign In &rarr;
            </Link>
          </div>
        )}

        {/* Reviews List */}
        {isLoadingReviews ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-theme-brand" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-theme-border py-10 text-center">
            <Star className="mx-auto h-7 w-7 text-theme-muted stroke-[1.5]" />
            <p className="mt-2 text-xs font-semibold text-theme-primary">No verified reviews yet</p>
            <p className="mt-0.5 text-[11px] text-theme-muted">
              Be the first resident with an approved booking to rate this accommodation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="rounded-xl border border-theme-border bg-theme-surface-subtle/40 p-4 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-theme-surface-hover font-bold text-theme-primary text-[11px]">
                      {rev.tenant?.name?.[0] || 'T'}
                    </div>
                    <div>
                      <span className="font-bold text-theme-primary">{rev.tenant?.name || 'Resident'}</span>
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        <span>Verified Stay</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-theme-muted text-[11px]">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-theme-border'
                          }`}
                        />
                      ))}
                    </div>
                    <span>&bull;</span>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-theme-secondary leading-relaxed pl-9 whitespace-pre-line">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Request Modal */}
      <BookingModal
        pg={pg}
        rooms={rooms}
        selectedRoom={selectedBookingRoom}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
};

export default PGDetailsPage;
