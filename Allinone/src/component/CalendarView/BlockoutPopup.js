import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Button } from '@mui/material';
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import './Popup.css';

const BlockoutPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  // const [endDate, setEndDate] = useState('');
  const [blockoutDescription, setBlockoutDescription] = useState('');
  const [errors, setErrors] = useState([]);
  const [timeslot, setTimeslot] = useState({'anchorKey': 'FULL', 'currentKey': 'FULL'}); // Default: FULL day

  const openPopup = () => {
    setIsOpen(true);
  };

  const closePopup = () => {
    if (title || startDate || blockoutDescription) {
      if (window.confirm('Are you sure you want to close the popup? All changes will be lost.')) {
        resetForm();
      }
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setTitle('');
    setStartDate('');
    // setEndDate('');
    setBlockoutDescription('');
    setErrors([]);
    setTimeslot({'anchorKey': 'FULL', 'currentKey': 'FULL'});
  };

  const handleSubmit = async () => {
    // Validate input fields before submitting blockout
    if (!validateInputs()) return; // Validate and exit if errors exist

    try {
      const response = await axios.post('http://54.84.53.208:5012/manage_blockout', {
        title,
        start_date: startDate,
        end_date: startDate,
        timeslot: timeslot,
        blockout_description: blockoutDescription,
      });
      if (response.status === 200) {
        alert('Blockout created successfully');
        resetForm();
      }
      if (response.status === 409) {
        alert('Failed to create blockout.', response.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // Handle the 409 conflict error (blockout already exists)
        alert("Failed to create blockout. At least one blockout already exists within the selected date range.")
      }
      else {
        console.error('Error creating blockout:', error);
        alert('Failed to create blockout');
      }
    }
  };

  const today = new Date();
  today.setHours(0,0,0,0)

  const validateInputs = () => {
    const currentErrors = [];

    if (!title) {
      currentErrors.push('Title is required.');
    }
    if (!startDate) {
      currentErrors.push('Date is required.');
    }

    if (startDate && new Date(startDate) < today) {
      currentErrors.push("The selected date must be a current or future date.");
    }

    setErrors(currentErrors);
    return currentErrors.length === 0; // Return true if no errors
  };

  // Clears the errors being displayed when input is correct
  const handleInputChange = (field, value) => {
    // Update state based on the field being updated
    let updatedErrors = [...errors];

    switch (field) {
      case 'title':
        setTitle(value);
        if (value && updatedErrors.includes('Title is required.')) {
          updatedErrors = updatedErrors.filter(error => error !== 'Title is required.'); // removes the title error
        }
        break;
      case 'startDate':
        setStartDate(value);
        if (value && updatedErrors.includes('Date is required.')) {
          updatedErrors = updatedErrors.filter(error => error !== 'Date is required.');
        }

        if (value && new Date(value) >= today && updatedErrors.includes("The selected date must be a current or future date.")) {
          updatedErrors = updatedErrors.filter(error => error !== "The selected date must be a current or future date.");
        }
        break;
      case 'blockoutDescription':
        setBlockoutDescription(value);
        break;
      default:
        break;
    }

    setErrors(updatedErrors);
  };

  // Helper function to check if a field has an error
  const hasError = (field) => {
    if (field === 'title' && errors.includes('Title is required.')) return true;
    if (field === 'startDate' && errors.includes('Date is required.')) return true;
    if (startDate && new Date(startDate) < today && field === 'startDate') return true;
    return false;
  };

  // For Timeslot dropdown
  const [selectedKey, setSelectedKey] = useState(["FULL"]);

  const selectedValue = useMemo(
    () => Array.from(selectedKey).join(", ").replaceAll("_", " "),
    [selectedKey]
  );
  

  const handleTimeslotChange = (key) => {
    setSelectedKey(key);
    setTimeslot(key);
  }

  return (
    <div>
      <Button style={{marginLeft:"5px"}} variant="contained" onClick={openPopup}>Block Out Dates</Button>

      {isOpen && (
        <div className="popup">
          <div className="popup-content">
            <h2>Blockout</h2>

            {/* Render all error messages */}
            {errors.length > 0 && (
              <div className="error-message-box">
                <ol>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ol>
              </div>
            )}

            <label className={hasError('title') ? 'error-input' : ''}>
              Title:
              <input
                type="text"
                value={title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </label>
            <label className={hasError('startDate') ? 'error-input' : ''}>
              Date:
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
              />
            </label>
            <label>
              Timeslot:
              <Dropdown>
                <DropdownTrigger>
                  <Button color="primary" variant="outlined" style={{marginLeft:"10px"}}>
                    {selectedValue}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Timeslot selection"
                  variant="flat"
                  disallowEmptySelection
                  selectionMode="single"
                  selectedKey={selectedKey}
                  onSelectionChange={handleTimeslotChange}
                >
                  <DropdownItem key="FULL">Full Day</DropdownItem>
                  <DropdownItem key="AM">Morning (9am-1pm)</DropdownItem>
                  <DropdownItem key="PM">Afternoon (2pm-6pm)</DropdownItem>
                </DropdownMenu> 
              </Dropdown>
            </label>
            <label style={{display:"flex"}}>
              <span style={{alignItems:"top"}}>Description (optional):</span>
              <textarea
                value={blockoutDescription}
                onChange={(e) => handleInputChange('blockoutDescription', e.target.value)}
              />
            </label>
            <div className="popup-buttons">
              <Button onClick={closePopup}>Close</Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to disable interaction with background */}
      {isOpen && <div className="popup-overlay"></div>}
    </div>
  );
};

export default BlockoutPopup;