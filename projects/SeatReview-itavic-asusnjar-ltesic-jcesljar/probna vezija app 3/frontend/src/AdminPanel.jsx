import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

const API_BASE = "http://localhost:5000/api";

function AdminPanel() {
  const { token, user } = useAuth();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // New venue form
  const [newVenue, setNewVenue] = useState({
    name: "",
    address: "",
    type: "",
    category: "stadium"
  });

  // Edit venue form
  const [editingVenue, setEditingVenue] = useState(null);

  // Image upload state
  const [selectedVenueForImages, setSelectedVenueForImages] = useState(null);
  const [venueImages, setVenueImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [is360, setIs360] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchVenues();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const res = await fetch(`${API_BASE}/venues`);
      if (res.ok) {
        const data = await res.json();
        setVenues(data);
      }
    } catch (err) {
      console.error("Error fetching venues:", err);
    }
  };

  const fetchVenueImages = async (venueId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/venues/${venueId}/images`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVenueImages(data.images);
      }
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  const toggleAdmin = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-admin`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
        setMessage("Admin status updated!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error toggling admin:", err);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
        fetchStats();
        setMessage("User deleted!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const createVenue = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/venues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newVenue)
      });
      if (res.ok) {
        fetchVenues();
        fetchStats();
        setNewVenue({ name: "", address: "", type: "", category: "stadium" });
        setMessage("Venue created!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error creating venue:", err);
    }
  };

  const updateVenue = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/venues/${editingVenue.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editingVenue)
      });
      if (res.ok) {
        fetchVenues();
        setEditingVenue(null);
        setMessage("Venue updated!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error updating venue:", err);
    }
  };

  const deleteVenue = async (venueId) => {
    if (!window.confirm("Are you sure you want to delete this venue and all its data?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/venues/${venueId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchVenues();
        fetchStats();
        setMessage("Venue deleted!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting venue:", err);
    }
  };

  // Image upload functions
  const openImageManager = (venue) => {
    setSelectedVenueForImages(venue);
    fetchVenueImages(venue.id);
  };

  const closeImageManager = () => {
    setSelectedVenueForImages(null);
    setVenueImages([]);
    setIs360(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    if (!selectedVenueForImages) return;

    setUploadingImages(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
    formData.append("is_360", is360.toString());

    try {
      const res = await fetch(`${API_BASE}/admin/venues/${selectedVenueForImages.id}/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        setTimeout(() => setMessage(""), 3000);
        fetchVenueImages(selectedVenueForImages.id);
        fetchStats();
      } else {
        const error = await res.json();
        setMessage(`Error: ${error.error}`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error uploading images:", err);
      setMessage("Error uploading images");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploadingImages(false);
    }
  };

  const deleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/images/${imageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Image deleted!");
        setTimeout(() => setMessage(""), 3000);
        fetchVenueImages(selectedVenueForImages.id);
        fetchStats();
      }
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  };

  if (loading) {
    return <div className="loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-panel">
      <Link to="/" className="back-button">
        ← Povratak na početnu
      </Link>
      <h2 className="admin-title">Admin Panel</h2>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          Statistics
        </button>
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`admin-tab ${activeTab === "venues" ? "active" : ""}`}
          onClick={() => setActiveTab("venues")}
        >
          Venues
        </button>
        <button
          className={`admin-tab ${activeTab === "images" ? "active" : ""}`}
          onClick={() => setActiveTab("images")}
        >
          Images
        </button>
      </div>

      {/* Stats Tab */}
      {activeTab === "stats" && stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{stats.users}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏟️</div>
            <div className="stat-number">{stats.venues}</div>
            <div className="stat-label">Total Venues</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-number">{stats.reviews}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📸</div>
            <div className="stat-number">{stats.photos}</div>
            <div className="stat-label">Total Photos</div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="admin-users">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Reviews</th>
                <th>Verified</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.review_count}</td>
                  <td>{u.is_verified ? "Yes" : "No"}</td>
                  <td>
                    <span className={`admin-badge ${u.is_admin ? "admin" : "user"}`}>
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td>
                    {u.id !== user.id && (
                      <>
                        <button
                          className="btn-small btn-toggle"
                          onClick={() => toggleAdmin(u.id)}
                        >
                          {u.is_admin ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button
                          className="btn-small btn-danger"
                          onClick={() => deleteUser(u.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {u.id === user.id && <span className="you-badge">You</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Venues Tab */}
      {activeTab === "venues" && (
        <div className="admin-venues">
          {/* Add New Venue Form */}
          <div className="admin-form-card">
            <h3>Add New Venue</h3>
            <form onSubmit={createVenue} className="admin-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Venue Name *"
                  value={newVenue.name}
                  onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newVenue.address}
                  onChange={(e) => setNewVenue({ ...newVenue, address: e.target.value })}
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Type (e.g., football, basketball)"
                  value={newVenue.type}
                  onChange={(e) => setNewVenue({ ...newVenue, type: e.target.value })}
                />
                <select
                  value={newVenue.category}
                  onChange={(e) => setNewVenue({ ...newVenue, category: e.target.value })}
                >
                  <option value="stadium">Stadium</option>
                  <option value="arena">Arena/Theatre</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Add Venue</button>
            </form>
          </div>

          {/* Edit Venue Modal */}
          {editingVenue && (
            <div className="admin-modal-overlay">
              <div className="admin-modal">
                <h3>Edit Venue</h3>
                <form onSubmit={updateVenue} className="admin-form">
                  <input
                    type="text"
                    placeholder="Venue Name"
                    value={editingVenue.name}
                    onChange={(e) => setEditingVenue({ ...editingVenue, name: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={editingVenue.address || ""}
                    onChange={(e) => setEditingVenue({ ...editingVenue, address: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Type"
                    value={editingVenue.type || ""}
                    onChange={(e) => setEditingVenue({ ...editingVenue, type: e.target.value })}
                  />
                  <select
                    value={editingVenue.category}
                    onChange={(e) => setEditingVenue({ ...editingVenue, category: e.target.value })}
                  >
                    <option value="stadium">Stadium</option>
                    <option value="arena">Arena/Theatre</option>
                  </select>
                  <div className="modal-buttons">
                    <button type="submit" className="btn-primary">Save</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingVenue(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Venues List */}
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Address</th>
                <th>Type</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.name}</td>
                  <td>{v.address || "-"}</td>
                  <td>{v.type || "-"}</td>
                  <td>
                    <span className={`category-badge ${v.category}`}>
                      {v.category === "stadium" ? "Stadium" : "Arena"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-small btn-edit"
                      onClick={() => setEditingVenue(v)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-small btn-danger"
                      onClick={() => deleteVenue(v.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Images Tab */}
      {activeTab === "images" && (
        <div className="admin-images">
          {!selectedVenueForImages ? (
            <>
              <h3>Select a venue to manage images</h3>
              <div className="venue-image-cards">
                {venues.map((v) => (
                  <div
                    key={v.id}
                    className="venue-image-card"
                    onClick={() => openImageManager(v)}
                  >
                    <div className="venue-image-icon">
                      {v.category === "stadium" ? "🏟️" : "🎭"}
                    </div>
                    <h4>{v.name}</h4>
                    <p>{v.address || "No address"}</p>
                    <button className="btn-primary btn-small">Manage Images</button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="image-manager-header">
                <button className="btn-secondary" onClick={closeImageManager}>
                  ← Back to Venues
                </button>
                <h3>Images for: {selectedVenueForImages.name}</h3>
              </div>

              {/* Upload Area */}
              <div className="upload-section">
                <div className="upload-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={is360}
                      onChange={(e) => setIs360(e.target.checked)}
                    />
                    <span>360° Photo</span>
                  </label>
                </div>

                <div
                  className={`drop-zone ${dragActive ? "drag-active" : ""} ${uploadingImages ? "uploading" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    style={{ display: "none" }}
                  />
                  {uploadingImages ? (
                    <div className="upload-progress">
                      <div className="spinner"></div>
                      <p>Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="drop-zone-icon">📁</div>
                      <p className="drop-zone-text">
                        Drag & drop images here or click to select
                      </p>
                      <p className="drop-zone-hint">
                        Supports: JPG, PNG, GIF (max 10 files)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Image Gallery */}
              <div className="image-gallery-admin">
                {venueImages.length === 0 ? (
                  <div className="no-images">
                    <p>No images uploaded yet</p>
                  </div>
                ) : (
                  <div className="image-grid">
                    {venueImages.map((img) => (
                      <div key={img.id} className="image-item">
                        <img
                          src={`http://localhost:5000${img.file_path}`}
                          alt="Venue"
                        />
                        <div className="image-overlay">
                          {img.is_360 === 1 && (
                            <span className="badge-360">360°</span>
                          )}
                          <button
                            className="btn-delete-image"
                            onClick={() => deleteImage(img.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
