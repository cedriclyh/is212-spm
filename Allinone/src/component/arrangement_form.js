import React, { useState } from "react";

const ArrangementForm = () => {
  const [formData, setFormData] = useState({
    staff_id: "",
    requested_day: "",
    timeslot: "1",
    reason: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // Helper function to handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Define date constraints
  const today = new Date();
  const twoMonthsBack = new Date(today);
  twoMonthsBack.setMonth(today.getMonth() - 2);

  const threeMonthsForward = new Date(today);
  threeMonthsForward.setMonth(today.getMonth() + 3);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    
    fetch("/create_request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.code === 201) {
          setMessage("Request submitted successfully!");
          setFormData({
            staff_id: "",
            requested_day: "",
            timeslot: "1",
            reason: "",
          });
        } else {
          setError("Failed to submit the request. Please try again.");
        }
      })
      .catch((error) => {
        setError("An error occurred. Please try again.");
      });
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2>Arrangement Request Form</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="staff_id">Staff ID</label>
            <input
              type="text"
              className="form-control"
              id="staff_id"
              name="staff_id"
              value={formData.staff_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="requested_day">Requested Day</label>
            <input
              type="date"
              className="form-control"
              id="requested_day"
              name="requested_day"
              value={formData.requested_day}
              min={formatDate(twoMonthsBack)}
              max={formatDate(threeMonthsForward)}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="timeslot">Timeslot</label>
            <select
              className="form-control"
              id="timeslot"
              name="timeslot"
              value={formData.timeslot}
              onChange={handleChange}
            >
              <option value="1">Morning</option>
              <option value="2">Afternoon</option>
              <option value="3">Full Day</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason for Arrangement</label>
            <textarea
              className="form-control"
              id="reason"
              name="reason"
              rows="4"
              value={formData.reason}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <button type="submit" className="btn btn-success btn-block">
            Submit Request
          </button>
          <button
            type="button"
            className="btn btn-danger btn-block"
            onClick={() => window.location.href = "/"}
          >
            Close Request
          </button>
        </form>

        {/* Display success or error messages */}
        {message && <div className="alert alert-success mt-3">{message}</div>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </div>
    </div>
  );
};

export default ArrangementForm;
