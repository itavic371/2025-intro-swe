import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { translations } from "./translations";
import Navigation from "./Navigation";
import SeatMap from "./SeatMap";
import Favorites from "./Favorites";
import ViewHistory from "./ViewHistory";
import Leaderboard from "./Leaderboard";

const API_BASE = "http://localhost:5000/api";

function App() {
  const { user, token } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const [step, setStep] = useState(1); // 1 = category, 2 = venue selection, 3 = content
  const [category, setCategory] = useState("");
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [tab, setTab] = useState("seatmap");
  const [autoSelectSeat, setAutoSelectSeat] = useState(null);

  useEffect(() => {
    if (category && step === 2) {
      fetchVenues();
    }
  }, [category]);

  const fetchVenues = () => {
    const url = `${API_BASE}/venues?category=${category}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setVenues(data);
      })
      .catch((e) => console.error("Failed to load venues", e));
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setStep(2);
    setSelectedVenueId("");
  };

  const handleVenueSelect = (venueId) => {
    setSelectedVenueId(venueId);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setSelectedVenueId("");
      setAutoSelectSeat(null); // Clear auto-select when going back
    } else if (step === 2) {
      setStep(1);
      setCategory("");
      setVenues([]);
    }
  };

  const handleNavigateToSeat = async (venueId, section, row, seatNumber) => {
    try {
      // Fetch venue details to get the category
      const res = await fetch(`${API_BASE}/venues/${venueId}`);
      if (res.ok) {
        const venue = await res.json();

        // Set category and fetch venues for that category
        setCategory(venue.category);

        // Fetch venues for the category
        const venuesRes = await fetch(`${API_BASE}/venues?category=${venue.category}`);
        if (venuesRes.ok) {
          const venuesData = await venuesRes.json();
          setVenues(venuesData);
        }

        // Set the seat to auto-select
        setAutoSelectSeat({
          section,
          row,
          seat_number: seatNumber
        });

        // Navigate to the seat map
        setSelectedVenueId(venueId);
        setStep(3);
        setTab("seatmap");
      }
    } catch (err) {
      console.error("Error navigating to seat:", err);
    }
  };

  return (
    <>
      <Navigation />
      <div className="container">
        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="selection-container">
            <h2 className="selection-title">{t.selectCategory}</h2>
          <div className="category-cards">
            <div
              className="category-card"
              onClick={() => handleCategorySelect("stadium")}
            >
              <div className="category-icon">⚽</div>
              <h3>{t.stadiums}</h3>
              <p>{t.stadiumsDesc}</p>
            </div>
            <div
              className="category-card"
              onClick={() => handleCategorySelect("arena")}
            >
              <div className="category-icon">🎭</div>
              <h3>{t.arenasTheatres}</h3>
              <p>{t.arenasDesc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Venue Selection */}
      {step === 2 && (
        <div className="selection-container">
          <button className="back-button" onClick={handleBack}>
            ← {t.backToCategories}
          </button>
          <h2 className="selection-title">
            {category === "stadium" ? `⚽ ${t.selectStadium}` : `🎭 ${t.selectArena}`}
          </h2>
          <div className="venue-cards">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="venue-card"
                onClick={() => handleVenueSelect(venue.id)}
              >
                <h3>{venue.name}</h3>
                <p>{venue.address}</p>
                <div className="venue-type">{venue.type}</div>
              </div>
            ))}
          </div>
          {venues.length === 0 && (
            <p className="no-venues">{t.noVenues}</p>
          )}
        </div>
      )}

      {/* Step 3: Venue Content */}
      {step === 3 && selectedVenueId && (
        <>
          <button className="back-button" onClick={handleBack}>
            ← {t.backToVenues}
          </button>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={tab === "seatmap" ? "tab active" : "tab"}
              onClick={() => setTab("seatmap")}
            >
              🎫 {t.tabSeatMap || "Seat Map"}
            </button>
            <button
              className={tab === "reviews" ? "tab active" : "tab"}
              onClick={() => setTab("reviews")}
            >
              📝 {t.tabAllReviews}
            </button>
            <button
              className={tab === "submit" ? "tab active" : "tab"}
              onClick={() => setTab("submit")}
            >
              ✍️ {t.tabSubmitReview}
            </button>
            <button
              className={tab === "gallery" ? "tab active" : "tab"}
              onClick={() => setTab("gallery")}
            >
              📸 {t.tabGallery}
            </button>
            <button
              className={tab === "insights" ? "tab active" : "tab"}
              onClick={() => setTab("insights")}
            >
              📊 {t.tabInsights}
            </button>
            <button
              className={tab === "favorites" ? "tab active" : "tab"}
              onClick={() => setTab("favorites")}
            >
              ⭐ {t.tabFavorites || "Favorites"}
            </button>
            <button
              className={tab === "history" ? "tab active" : "tab"}
              onClick={() => setTab("history")}
            >
              📜 {t.tabHistory || "History"}
            </button>
            <button
              className={tab === "leaderboard" ? "tab active" : "tab"}
              onClick={() => setTab("leaderboard")}
            >
              🏆 {t.tabLeaderboard || "Leaderboard"}
            </button>
          </div>

          {/* Content */}
          {tab === "seatmap" && (
            <SeatMap
              venueId={selectedVenueId}
              venueName={venues.find((v) => v.id === selectedVenueId)?.name}
              autoSelectSeat={autoSelectSeat}
            />
          )}
          {tab === "reviews" && <AllReviews venueId={selectedVenueId} />}
          {tab === "submit" && <ReviewForm venueId={selectedVenueId} token={token} />}
          {tab === "gallery" && <VenueGallery venueId={selectedVenueId} />}
          {tab === "insights" && <VenueInsights venueId={selectedVenueId} />}
          {tab === "favorites" && <Favorites />}
          {tab === "history" && <ViewHistory onNavigateToSeat={handleNavigateToSeat} />}
          {tab === "leaderboard" && <Leaderboard />}
        </>
      )}
      </div>
    </>
  );
}

// New component to show all reviews
function AllReviews({ venueId }) {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState({}); // { reviewId: { likes, dislikes } }
  const [userVotes, setUserVotes] = useState({}); // { reviewId: 'like' | 'dislike' | null }

  useEffect(() => {
    fetch(`${API_BASE}/venues/${venueId}/reviews`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data);
        setLoading(false);
        // Fetch votes for each review
        data.forEach((review) => {
          fetchVotes(review.id);
          if (token) {
            fetchUserVote(review.id);
          }
        });
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [venueId, token]);

  const fetchVotes = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/votes`);
      if (res.ok) {
        const data = await res.json();
        setVotes((prev) => ({ ...prev, [reviewId]: data }));
      }
    } catch (err) {
      console.error("Error fetching votes:", err);
    }
  };

  const fetchUserVote = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/my-vote`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserVotes((prev) => ({ ...prev, [reviewId]: data.vote_type }));
      }
    } catch (err) {
      console.error("Error fetching user vote:", err);
    }
  };

  const handleVote = async (reviewId, voteType) => {
    if (!token) {
      alert("Morate biti prijavljeni da biste glasali");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      });

      if (res.ok) {
        // Refresh votes
        fetchVotes(reviewId);
        fetchUserVote(reviewId);
      }
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  if (loading) return <div className="loading-small">Loading reviews...</div>;

  if (reviews.length === 0) {
    return (
      <div className="card">
        <p className="no-content">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="reviews-container">
      <h3 className="reviews-header">All Reviews ({reviews.length})</h3>
      {reviews.map((review) => (
        <div key={review.id} className="review-card">
          <div className="review-header">
            <div className="review-location">
              <span className="review-badge">Section: {review.section || "N/A"}</span>
              <span className="review-badge">Row: {review.row || "N/A"}</span>
              <span className="review-badge">Seat: {review.seat_number || "N/A"}</span>
            </div>
            <div className="review-user">
              {review.user_email?.split("@")[0] || "Anonymous"}
            </div>
          </div>

          <div className="review-ratings">
            <div className="rating-item">
              <span className="rating-label">Comfort</span>
              <div className="rating-stars">
                {"★".repeat(review.rating_comfort || 0)}
                {"☆".repeat(5 - (review.rating_comfort || 0))}
              </div>
              <span className="rating-value">{review.rating_comfort || "N/A"}/5</span>
            </div>
            <div className="rating-item">
              <span className="rating-label">Legroom</span>
              <div className="rating-stars">
                {"★".repeat(review.rating_legroom || 0)}
                {"☆".repeat(5 - (review.rating_legroom || 0))}
              </div>
              <span className="rating-value">{review.rating_legroom || "N/A"}/5</span>
            </div>
            <div className="rating-item">
              <span className="rating-label">Visibility</span>
              <div className="rating-stars">
                {"★".repeat(review.rating_visibility || 0)}
                {"☆".repeat(5 - (review.rating_visibility || 0))}
              </div>
              <span className="rating-value">{review.rating_visibility || "N/A"}/5</span>
            </div>
            <div className="rating-item">
              <span className="rating-label">Cleanliness</span>
              <div className="rating-stars">
                {"★".repeat(review.rating_cleanliness || 0)}
                {"☆".repeat(5 - (review.rating_cleanliness || 0))}
              </div>
              <span className="rating-value">{review.rating_cleanliness || "N/A"}/5</span>
            </div>
          </div>

          {review.text_review && (
            <div className="review-text">
              <p>{review.text_review}</p>
            </div>
          )}

          <div className="review-footer">
            <span className="review-date">
              {new Date(review.created_at).toLocaleDateString("hr-HR", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </span>
            <div className="review-votes">
              <button
                className={`vote-btn vote-like ${userVotes[review.id] === 'like' ? 'active' : ''}`}
                onClick={() => handleVote(review.id, 'like')}
                title="Svidja mi se"
              >
                <span className="vote-icon">👍</span>
                <span className="vote-count">{votes[review.id]?.likes || 0}</span>
              </button>
              <button
                className={`vote-btn vote-dislike ${userVotes[review.id] === 'dislike' ? 'active' : ''}`}
                onClick={() => handleVote(review.id, 'dislike')}
                title="Ne svidja mi se"
              >
                <span className="vote-icon">👎</span>
                <span className="vote-count">{votes[review.id]?.dislikes || 0}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ReviewForm component (same as before but with better styling)
function ReviewForm({ venueId, token }) {
  const [formData, setFormData] = useState({
    section: "",
    row: "",
    seat_number: "",
    price: "",
    rating_comfort: "",
    rating_legroom: "",
    rating_visibility: "",
    rating_cleanliness: "",
    text_review: ""
  });
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");

    const formDataToSend = new FormData();
    formDataToSend.append("venue_id", venueId);
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });
    photos.forEach((photo) => {
      formDataToSend.append("photos", photo);
    });

    try {
      const response = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        setStatus("✅ Review submitted successfully!");
        setFormData({
          section: "",
          row: "",
          seat_number: "",
          price: "",
          rating_comfort: "",
          rating_legroom: "",
          rating_visibility: "",
          rating_cleanliness: "",
          text_review: ""
        });
        setPhotos([]);
        setTimeout(() => setStatus(""), 3000);
      } else {
        setStatus("❌ Failed to submit review");
      }
    } catch (error) {
      setStatus("❌ Error: " + error.message);
    }
  };

  return (
    <div className="card review-form-card">
      <h3>Submit Your Seat Review</h3>
      <form className="review-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h4 className="form-section-title">📍 Seat Location</h4>
          <div className="grid-3">
            <div>
              <label className="label">Section</label>
              <input
                name="section"
                className="input"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g., A"
              />
            </div>
            <div>
              <label className="label">Row</label>
              <input
                name="row"
                className="input"
                value={formData.row}
                onChange={handleChange}
                placeholder="e.g., 5"
              />
            </div>
            <div>
              <label className="label">Seat Number</label>
              <input
                name="seat_number"
                className="input"
                value={formData.seat_number}
                onChange={handleChange}
                placeholder="e.g., 12"
              />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <label className="label">💰 Price (€)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g., 85.50"
            />
          </div>
        </div>

        <div className="form-section">
          <h4 className="form-section-title">⭐ Ratings (1-5 stars)</h4>
          <div className="grid-2">
            <div className="rating-input">
              <label className="label">🛋️ Comfort</label>
              <input
                type="number"
                name="rating_comfort"
                className="input"
                min="1"
                max="5"
                value={formData.rating_comfort}
                onChange={handleChange}
                placeholder="1-5"
              />
            </div>
            <div className="rating-input">
              <label className="label">🦵 Legroom</label>
              <input
                type="number"
                name="rating_legroom"
                className="input"
                min="1"
                max="5"
                value={formData.rating_legroom}
                onChange={handleChange}
                placeholder="1-5"
              />
            </div>
            <div className="rating-input">
              <label className="label">👁️ Visibility</label>
              <input
                type="number"
                name="rating_visibility"
                className="input"
                min="1"
                max="5"
                value={formData.rating_visibility}
                onChange={handleChange}
                placeholder="1-5"
              />
            </div>
            <div className="rating-input">
              <label className="label">✨ Cleanliness</label>
              <input
                type="number"
                name="rating_cleanliness"
                className="input"
                min="1"
                max="5"
                value={formData.rating_cleanliness}
                onChange={handleChange}
                placeholder="1-5"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4 className="form-section-title">💬 Your Experience</h4>
          <textarea
            name="text_review"
            className="input textarea"
            value={formData.text_review}
            onChange={handleChange}
            placeholder="Share your experience with this seat..."
            rows="4"
          />
        </div>

        <div className="form-section">
          <h4 className="form-section-title">📸 Photos (optional, max 5)</h4>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="input"
          />
          {photos.length > 0 && (
            <div className="file-preview">
              {photos.length} file(s) selected
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary btn-large">
          Submit Review
        </button>
        {status && <div className="form-status">{status}</div>}
      </form>
    </div>
  );
}

// VenueGallery component - SeatGeek style with sector views + Virtual Tour
function VenueGallery({ venueId }) {
  const [photos, setPhotos] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState(null);
  const [showVirtualTour, setShowVirtualTour] = useState(false);

  useEffect(() => {
    // Fetch venue details (for virtual tour URL)
    fetch(`${API_BASE}/venues/${venueId}`)
      .then((r) => r.json())
      .then((data) => {
        setVenue(data);
      })
      .catch((e) => console.error(e));

    // Fetch gallery photos with section info
    fetch(`${API_BASE}/venues/${venueId}/gallery`)
      .then((r) => r.json())
      .then((data) => {
        setPhotos(data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [venueId]);

  // Group photos by section
  const sectionGroups = photos.reduce((acc, photo) => {
    const section = photo.section || "General";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(photo);
    return acc;
  }, {});

  const sections = Object.keys(sectionGroups);

  if (loading) {
    return <div className="loading-small">Loading gallery...</div>;
  }

  // Check if venue has virtual tour
  const hasVirtualTour = venue && venue.virtual_tour_url;

  // Get clean tour URL (add parameters to hide branding for Matterport)
  const getTourUrl = () => {
    if (!venue || !venue.virtual_tour_url) return '';
    let url = venue.virtual_tour_url;
    // For Matterport tours, add parameters to hide branding
    if (url.includes('matterport.com')) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}play=1&qs=1&brand=0&mls=2&wh=0&guides=0&title=0`;
    }
    return url;
  };

  return (
    <div className="seatgeek-gallery">
      {/* Virtual Tour Section */}
      {hasVirtualTour && (
        <div className="virtual-tour-section">
          <div className="virtual-tour-header">
            <h3>360° Virtualna Šetnja</h3>
            <p className="gallery-subtitle">Istražite {venue.name} u 360° panoramskom prikazu</p>
          </div>

          {!showVirtualTour ? (
            <div className="virtual-tour-preview" onClick={() => setShowVirtualTour(true)}>
              <div className="virtual-tour-overlay">
                <div className="play-button">
                  <span>▶</span>
                </div>
                <span className="tour-label">Kliknite za virtualnu šetnju</span>
              </div>
            </div>
          ) : (
            <div className="virtual-tour-container">
              <div className="virtual-tour-controls">
                <button
                  className="close-tour-btn"
                  onClick={() => setShowVirtualTour(false)}
                >
                  Zatvori virtualnu šetnju
                </button>
              </div>
              <iframe
                src={getTourUrl()}
                title="360° Virtual Tour"
                className="virtual-tour-iframe"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {/* Gallery Header */}
      <div className="gallery-header">
        <h3>Seat Views by Section</h3>
        <p className="gallery-subtitle">Click on a section to see views from that area</p>
      </div>

      {sections.length === 0 ? (
        <div className="no-photos-message">
          <p className="no-content">No seat view photos yet. Be the first to share your view!</p>
        </div>
      ) : (
        <>
          {/* Section Cards Grid */}
          <div className="section-cards-grid">
            {sections.map((sectionName) => {
              const sectionPhotos = sectionGroups[sectionName];
              const mainPhoto = sectionPhotos[0];
              const photoCount = sectionPhotos.length;
              const ratingsArr = sectionPhotos.map(p => {
                const ratings = [p.rating_comfort, p.rating_visibility, p.rating_legroom, p.rating_cleanliness].filter(Boolean);
                return ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
              }).filter(r => r > 0);
              const avgRating = ratingsArr.length ? ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length : 0;

              return (
                <div
                  key={sectionName}
                  className={`section-card ${selectedSection === sectionName ? 'active' : ''}`}
                  onClick={() => setSelectedSection(selectedSection === sectionName ? null : sectionName)}
                >
                  <div className="section-card-image">
                    {mainPhoto ? (
                      <img
                        src={`http://localhost:5000${mainPhoto.file_path}`}
                        alt={`View from ${sectionName}`}
                      />
                    ) : (
                      <div className="no-image-placeholder">
                        <span>📷</span>
                      </div>
                    )}
                    <div className="section-card-overlay">
                      <span className="section-name">Section {sectionName}</span>
                      <span className="photo-count">{photoCount} {photoCount === 1 ? 'photo' : 'photos'}</span>
                    </div>
                  </div>
                  <div className="section-card-info">
                    <div className="section-rating">
                      {avgRating > 0 ? (
                        <>
                          <span className="stars">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                          <span className="rating-text">{avgRating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="no-rating">No ratings yet</span>
                      )}
                    </div>
                    <div className="section-reviews-count">
                      {photoCount} {photoCount === 1 ? 'view' : 'views'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Section View */}
          {selectedSection && (
            <div className="section-expanded">
              <div className="section-expanded-header">
                <h4>Views from Section {selectedSection}</h4>
                <button className="close-btn" onClick={() => setSelectedSection(null)}>✕</button>
              </div>
              <div className="section-photos-grid">
                {sectionGroups[selectedSection].map((photo) => (
                  <div key={photo.id} className="section-photo-item">
                    <img
                      src={`http://localhost:5000${photo.file_path}`}
                      alt={`View from Section ${selectedSection}`}
                    />
                    <div className="photo-info">
                      <span className="photo-location">
                        Row {photo.row || '?'}, Seat {photo.seat_number || '?'}
                      </span>
                      {photo.text_review && (
                        <p className="photo-comment">"{photo.text_review}"</p>
                      )}
                      <span className="photo-author">by {photo.user_email?.split('@')[0] || 'Anonymous'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// VenueInsights component
function VenueInsights({ venueId }) {
  const [stats, setStats] = useState(null);
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/venues/${venueId}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch((e) => console.error(e));

    fetch(`${API_BASE}/venues/${venueId}/insights`)
      .then((r) => {
        if (r.ok) return r.json();
        return null;
      })
      .then(setInsight)
      .catch((e) => console.error(e));
  }, [venueId]);

  if (!stats) return <div className="loading-small">Loading...</div>;

  return (
    <div className="card">
      <h3>Venue Statistics & Insights</h3>
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-label">Total Reviews</div>
          <div className="stat-value">{stats.total_reviews || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">🛋️ Avg Comfort</div>
          <div className="stat-value">
            {stats.avg_comfort ? stats.avg_comfort.toFixed(1) : "N/A"}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">🦵 Avg Legroom</div>
          <div className="stat-value">
            {stats.avg_legroom ? stats.avg_legroom.toFixed(1) : "N/A"}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">👁️ Avg Visibility</div>
          <div className="stat-value">
            {stats.avg_visibility ? stats.avg_visibility.toFixed(1) : "N/A"}
          </div>
        </div>
      </div>

      {insight && (
        <div className="ai-section">
          <h4>AI-Generated Summary</h4>
          <div className="ai-summary">{insight.summary_text}</div>
        </div>
      )}
    </div>
  );
}

export default App;
