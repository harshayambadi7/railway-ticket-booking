import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { SearchForm } from './components/SearchForm';
import { TrainResultCard } from './components/TrainResultCard';
import { BookingModal } from './components/BookingModal';
import { TicketConfirmation } from './components/TicketConfirmation';
import { MyBookings } from './components/MyBookings';
import { PNRStatusModal } from './components/PNRStatusModal';
import { Footer } from './components/Footer';
import {
  ClassAvailabilityInfo,
  SearchCriteria,
  SearchResultTrain,
} from './models/types';
import { Booking } from './models/Booking';
import { SearchService } from './services/searchService';
import { AlertIcon, ShieldCheckIcon, TrainIcon, UsersIcon } from './components/Icons';

export const App: React.FC = () => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Navigation state
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'bookings' | 'ticket'>('home');

  // Search state
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    originCode: 'BZA',
    destinationCode: 'MAS',
    journeyDate: getTodayString(),
    passengerCount: 1,
  });
  const [searchResults, setSearchResults] = useState<SearchResultTrain[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'departure_asc' | 'fare_asc' | 'duration_asc'>('departure_asc');

  // Booking modal state
  const [bookingTarget, setBookingTarget] = useState<{
    train: SearchResultTrain;
    selectedClass: ClassAvailabilityInfo;
  } | null>(null);

  // Active confirmed ticket to display
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // PNR quick search modal
  const [isPNRModalOpen, setIsPNRModalOpen] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Execute train search
  const handlePerformSearch = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    setSearchError(null);

    const { results, error } = SearchService.search(criteria);
    if (error) {
      setSearchError(error);
      setSearchResults([]);
    } else {
      const sorted = SearchService.sortResults(results, sortBy);
      setSearchResults(sorted);
    }

    setHasSearched(true);
    setActiveTab('search');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Re-sort results when sort criteria changes
  const handleSortChange = (newSort: 'departure_asc' | 'fare_asc' | 'duration_asc') => {
    setSortBy(newSort);
    const sorted = SearchService.sortResults(searchResults, newSort);
    setSearchResults(sorted);
  };

  // Open booking modal
  const handleSelectClass = (train: SearchResultTrain, classInfo: ClassAvailabilityInfo) => {
    setBookingTarget({ train, selectedClass: classInfo });
  };

  // When booking successfully confirms
  const handleBookingSuccess = (booking: Booking) => {
    setBookingTarget(null);
    setConfirmedBooking(booking);
    setActiveTab('ticket');
    showToast(`Booking Confirmed! PNR: ${booking.pnr}`);

    // Refresh current search results to reflect decremented inventory
    if (hasSearched) {
      const { results } = SearchService.search(searchCriteria);
      setSearchResults(SearchService.sortResults(results, sortBy));
    }
  };

  // Popular quick route search presets
  const handleQuickRoute = (from: string, to: string) => {
    const criteria: SearchCriteria = {
      originCode: from,
      destinationCode: to,
      journeyDate: searchCriteria.journeyDate || getTodayString(),
      passengerCount: 1,
    };
    handlePerformSearch(criteria);
  };

  // Execute initial default search once on mount to populate search tab immediately
  useEffect(() => {
    const { results } = SearchService.search({
      originCode: 'BZA',
      destinationCode: 'MAS',
      journeyDate: getTodayString(),
      passengerCount: 1,
    });
    setSearchResults(SearchService.sortResults(results, 'departure_asc'));
    setHasSearched(true);
  }, []);

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab === 'ticket' ? 'bookings' : activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPNRModal={() => setIsPNRModalOpen(true)}
      />

      <main className="main-content">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div>
            {/* Hero Section with Search Form */}
            <HeroBanner onSearch={handlePerformSearch} />

            {/* Quick Popular Routes Pills */}
            <div style={{ maxWidth: '1200px', margin: '-1.5rem auto 2.5rem auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
              <div
                style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--slate-200)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-500)' }}>
                  Popular Routes:
                </span>
                {[
                  { label: 'Vijayawada ➔ Chennai', from: 'BZA', to: 'MAS' },
                  { label: 'Visakhapatnam ➔ Hyderabad', from: 'VSKP', to: 'SC' },
                  { label: 'Secunderabad ➔ Bengaluru', from: 'SC', to: 'SBC' },
                  { label: 'Secunderabad ➔ Mumbai', from: 'SC', to: 'CSMT' },
                  { label: 'Chennai ➔ New Delhi', from: 'MAS', to: 'NDLS' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickRoute(item.from, item.to)}
                    style={{
                      background: 'var(--slate-100)',
                      border: '1px solid var(--slate-200)',
                      borderRadius: '50px',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--navy-900)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--orange-50)';
                      e.currentTarget.style.borderColor = 'var(--orange-500)';
                      e.currentTarget.style.color = 'var(--orange-700)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--slate-100)';
                      e.currentTarget.style.borderColor = 'var(--slate-200)';
                      e.currentTarget.style.color = 'var(--navy-900)';
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Architecture Highlights & Features */}
            <div style={{ maxWidth: '1200px', margin: '2rem auto 4rem auto', padding: '0 1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                  Engineered with Clean Object-Oriented Principles
                </h3>
                <p style={{ color: 'var(--slate-500)', maxWidth: '650px', margin: '0.5rem auto 0 auto' }}>
                  A full-featured Indian Railway passenger booking simulation powered by TypeScript
                  class hierarchies, dynamic inventory management, and zero external dependencies.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                <div
                  style={{
                    background: 'var(--white)',
                    padding: '1.75rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--slate-200)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'var(--navy-50)',
                      color: 'var(--navy-800)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <TrainIcon size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-950)', marginBottom: '0.5rem' }}>
                    Polymorphic TrainClass Hierarchy
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                    Abstract <code>TrainClass</code> with concrete derived classes <code>SleeperClass</code>,{' '}
                    <code>ACClass</code>, and <code>GeneralClass</code> implementing distinct base rates,
                    GST additions, linen pack surcharges, and cancellation refund percentages.
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--white)',
                    padding: '1.75rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--slate-200)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'var(--orange-50)',
                      color: 'var(--orange-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <UsersIcon size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-950)', marginBottom: '0.5rem' }}>
                    Atomic Inventory & Capacity Caps
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                    Seat counts are isolated per train, journey date, and class in local storage.
                    Confirmation deducts seats atomically, while cancellation restores seats strictly up
                    to initial maximum capacity without inventory inflation.
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--white)',
                    padding: '1.75rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--slate-200)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'var(--emerald-50)',
                      color: 'var(--emerald-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <ShieldCheckIcon size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-950)', marginBottom: '0.5rem' }}>
                    Authentic IRCTC ERS Slip & PNR
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                    Generates 10-digit Indian Railway format PNRs (e.g. 842-1948291), allocates coach
                    and berth numbers (Lower/Upper/Side), and produces a clean, printable boarding ticket.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEARCH / TRAIN RESULTS */}
        {activeTab === 'search' && (
          <div>
            {/* Search Form Strip */}
            <div style={{ background: 'var(--navy-900)', padding: '2rem 1.5rem', borderBottom: '3px solid var(--orange-500)' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <SearchForm
                  initialCriteria={searchCriteria}
                  onSearch={handlePerformSearch}
                />
              </div>
            </div>

            {/* Results Container */}
            <div className="results-section">
              {searchError && (
                <div className="alert-banner alert-error" style={{ marginBottom: '1.5rem' }}>
                  <AlertIcon size={20} />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Header Bar */}
              <div className="results-header-bar">
                <div className="results-summary">
                  <h3>
                    Trains: {searchCriteria.originCode} ➔ {searchCriteria.destinationCode}
                  </h3>
                  <p>
                    Showing {searchResults.length} available train{searchResults.length === 1 ? '' : 's'} on{' '}
                    <strong>{searchCriteria.journeyDate}</strong> for{' '}
                    <strong>{searchCriteria.passengerCount} passenger{searchCriteria.passengerCount > 1 ? 's' : ''}</strong>
                  </p>
                </div>

                {/* Sort Controls */}
                {searchResults.length > 0 && (
                  <div className="sort-controls">
                    <span className="sort-label">Sort By:</span>
                    <button
                      className={`sort-btn ${sortBy === 'departure_asc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('departure_asc')}
                    >
                      Departure Time
                    </button>
                    <button
                      className={`sort-btn ${sortBy === 'fare_asc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('fare_asc')}
                    >
                      Lowest Fare
                    </button>
                    <button
                      className={`sort-btn ${sortBy === 'duration_asc' ? 'active' : ''}`}
                      onClick={() => handleSortChange('duration_asc')}
                    >
                      Fastest
                    </button>
                  </div>
                )}
              </div>

              {/* Train Result Cards */}
              {searchResults.length > 0 ? (
                <div>
                  {searchResults.map((train) => (
                    <TrainResultCard
                      key={train.trainNumber}
                      train={train}
                      passengerCount={searchCriteria.passengerCount}
                      onSelectClass={handleSelectClass}
                    />
                  ))}
                </div>
              ) : (
                /* No Trains Found Empty State */
                <div className="empty-state-box">
                  <div className="empty-state-icon">
                    <TrainIcon size={32} />
                  </div>
                  <h4>No Direct Trains Available</h4>
                  <p>
                    No trains currently serve the route from <strong>{searchCriteria.originCode}</strong> to{' '}
                    <strong>{searchCriteria.destinationCode}</strong> on {searchCriteria.journeyDate}.
                    Please verify station sequences or try popular connecting junctions like Vijayawada (BZA),
                    Secunderabad (SC), or Chennai Central (MAS).
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        handlePerformSearch({
                          ...searchCriteria,
                          originCode: 'BZA',
                          destinationCode: 'MAS',
                        })
                      }
                    >
                      Try BZA ➔ MAS
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        handlePerformSearch({
                          ...searchCriteria,
                          originCode: 'SC',
                          destinationCode: 'SBC',
                        })
                      }
                    >
                      Try SC ➔ SBC
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CONFIRMED TICKET VIEW */}
        {activeTab === 'ticket' && confirmedBooking && (
          <TicketConfirmation
            booking={confirmedBooking}
            onBookAnother={() => {
              setActiveTab('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToMyBookings={() => {
              setActiveTab('bookings');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* TAB 4: MY BOOKINGS */}
        {activeTab === 'bookings' && (
          <MyBookings
            onViewTicket={(booking) => {
              setConfirmedBooking(booking);
              setActiveTab('ticket');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBookNow={() => {
              setActiveTab('search');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            showToast={showToast}
          />
        )}
      </main>

      {/* Step-by-Step Booking Modal */}
      {bookingTarget && (
        <BookingModal
          train={bookingTarget.train}
          selectedClass={bookingTarget.selectedClass}
          journeyDate={searchCriteria.journeyDate}
          initialPassengerCount={searchCriteria.passengerCount}
          onClose={() => setBookingTarget(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Quick PNR Status Modal */}
      {isPNRModalOpen && (
        <PNRStatusModal
          onClose={() => setIsPNRModalOpen(false)}
          onViewTicket={(booking) => {
            setConfirmedBooking(booking);
            setActiveTab('ticket');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <ShieldCheckIcon size={20} color="var(--orange-500)" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPNRModal={() => setIsPNRModalOpen(true)}
      />
    </div>
  );
};
