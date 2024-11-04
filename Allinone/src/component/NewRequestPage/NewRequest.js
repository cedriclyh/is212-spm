import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DatePicker,
  Chip,
  RadioGroup,
  Radio,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Textarea,
  DateRangePicker,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import {
  extractWeekdays,
  checkAvailability,
  getAllDates,
} from "./NewRequestUtils";
import { getLocalTimeZone, today } from "@internationalized/date";
import { parseISO } from "date-fns";

var modalTitle = "Error Message";
var modalMsg = "";

const statusColorMap = {
  Available: "success",
  Blocked: "danger",
};

export default function NewRequest({ initialFormData }) {
  const [inputRequestID, setInputRequestID] = useState(
    initialFormData?.request_id || null
  );
  const [inputDates, setInputDates] = useState(
    initialFormData?.arrangement_date ? [initialFormData.arrangement_date] : []
  );
  const [selectedDate, setSelectedDate] = useState(
    initialFormData?.arrangement_date || null
  );
  const [selectedTimeslot, setSelectedTimeslot] = useState(
    initialFormData?.timeslot || "Choose a Timeslot"
  );
  const [SelectedDayOfTheWeek, setSelectedDayOfTheWeek] = useState(
    initialFormData?.recurring_day || "Choose a Week Day"
  );
  const [isRecurring, setIsRecurring] = useState(
    initialFormData?.is_recurring || false
  );
  const [startDate, setStartDate] = useState(
    initialFormData?.start_date ? parseISO(initialFormData.start_date) : null
  );
  const [endDate, setEndDate] = useState(
    initialFormData?.end_date ? parseISO(initialFormData.end_date) : null
  );
  const [reason, setReason] = useState(initialFormData?.reason || "");
  const [blockOutDates, setBlockOutDates] = useState([]);
  const [extractedDates, setExtractedDates] = useState([]);
  const [availability, setAvailability] = useState({});

  // Populate form data whenever `initialFormData` changes
  useEffect(() => {
    if (initialFormData) {
      setInputDates(
        initialFormData.arrangement_date
          ? [initialFormData.arrangement_date]
          : []
      );
      setSelectedDate(initialFormData.arrangement_date || null);
      setSelectedTimeslot(initialFormData.timeslot || "Choose a Timeslot");
      setSelectedDayOfTheWeek(
        initialFormData.recurring_day || "Choose a Week Day"
      );
      setIsRecurring(initialFormData.is_recurring || false);
      setStartDate(initialFormData.start_date || null);
      setEndDate(initialFormData.end_date || null);
      setReason(initialFormData.reason || "");
    }
  }, [initialFormData]);

  // for modal
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [buttonColor, setButtonColor] = useState("danger");
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    async function fetchBlockOutDates() {
      try {
        const response = await fetch(
          "http://localhost:5014/blockout/get_blockouts"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const output = await response.json();
        const dates = getAllDates(output.data);
        setBlockOutDates(dates);
      } catch (error) {
        console.error("Error fetching blockOutDates:", error);
        setBlockOutDates([]);
      }
    }

    fetchBlockOutDates();
  }, []);

  // Function to format the date from the object returned by DatePicker
  const formatDateFromPicker = (dateObject) => {
    if (dateObject && dateObject.year && dateObject.month && dateObject.day) {
      const day = String(dateObject.day).padStart(2, "0");
      const month = String(dateObject.month).padStart(2, "0");
      const year = dateObject.year;
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  const addDateInput = (inputDateToAdd) => {
    const formattedDate = formatDateFromPicker(inputDateToAdd);
    if (formattedDate) {
      setInputDates([formattedDate]);
      setSelectedDate(null);
    }
  };

  const handleSelection = (key) => {
    setSelectedTimeslot(key);
  };

  const handleSelectionDayOfTheWeek = (key) => {
    setSelectedDayOfTheWeek(key);
  };

  const handleRecurringChange = (value) => {
    setIsRecurring(value === "Yes");

    // Clear all the related states
    setInputDates([]);
    setSelectedTimeslot("Choose a Timeslot");
    setSelectedDayOfTheWeek("Choose a Week Day");
    setStartDate(null);
    setEndDate(null);
    setExtractedDates([]);
    setAvailability({});
    setReason("");
  };

  // useEffect(() => {
  //     console.log("isRecurring updated:", isRecurring);
  // }, [isRecurring]);

  // Update availability status when dates are extracted
  useEffect(() => {
    if (inputDates.length > 0 && !isRecurring) {
      const result = checkAvailability(inputDates, blockOutDates);
      setAvailability(result);
    } else if (extractedDates.length > 0 && isRecurring) {
      const result = checkAvailability(extractedDates, blockOutDates);
      setAvailability(result);
    }
  }, [inputDates, extractedDates, blockOutDates, isRecurring]);

  // UseEffect to trigger extractWeekdays whenever the startDate, endDate, or SelectedDayOfTheWeek changes
  useEffect(() => {
    if (isRecurring && startDate && endDate && SelectedDayOfTheWeek) {
      console.log(startDate);
      const dates = extractWeekdays(
        formatDateFromPicker(startDate),
        formatDateFromPicker(endDate),
        SelectedDayOfTheWeek
      );
      setExtractedDates(dates);
    }
  }, [startDate, endDate, SelectedDayOfTheWeek, isRecurring]);

  const [formData, setFormData] = useState({
    staff_id: 140004, // Change to dynamic value if needed
    manager_id: 140894,
    request_date: new Date().toISOString().split("T")[0],
    arrangement_date: "",
    recurring_day: "",
    start_date: "",
    end_date: "",
    timeslot: selectedTimeslot,
    reason: reason,
    is_recurring: isRecurring,
});

  useEffect(() => {
      setFormData((prevFormData) => ({
          ...prevFormData,
          arrangement_date: isRecurring ? null : inputDates[0] || "",
          recurring_day: isRecurring ? SelectedDayOfTheWeek : null,
          start_date: isRecurring ? formatDateFromPicker(startDate) : null,
          end_date: isRecurring ? formatDateFromPicker(endDate): null,
          timeslot: selectedTimeslot,
          reason: reason,
          is_recurring: isRecurring,
      }));
  }, [isRecurring, inputDates, SelectedDayOfTheWeek, startDate, endDate, selectedTimeslot, reason]);


  const handleSubmit = async (e) => {
    console.log(formData);
    if (isRecurring) {
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ];

      if (!validDays.includes(SelectedDayOfTheWeek)) {
        modalMsg = "Please select a valid recurring day (Monday to Friday).";
        onOpen();
        return;
      }

      if (!startDate || !endDate) {
        modalMsg = "Please select both a start date and an end date.";
        onOpen();
        return;
      }

      if (selectedTimeslot === "Choose a Timeslot") {
        modalMsg = "Please select a timeslot.";
        onOpen();
        return;
      }
    } else {
      if (formData.arrangement_date === "") {
        modalMsg = "Please select one WFH date.";
        onOpen();
        return;
      }

      if (selectedTimeslot === "Choose a Timeslot") {
        modalMsg = "Please select a timeslot.";
        onOpen();
        return;
      }

      if (blockOutDates.includes(inputDates[0])) {
        modalMsg = "Please select another WFH date.";
        onOpen();
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:5004/make_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        modalMsg = "Form processed successfully " + data.message;
        modalTitle = "Success!";
        setButtonColor("success");
        setShowCountdown(true);
        onOpen();

        // Start the countdown
        let countdownTimer = 3;
        setCountdown(countdownTimer);

        const timer = setInterval(() => {
          countdownTimer--;
          setCountdown(countdownTimer);

          if (countdownTimer === 0) {
            clearInterval(timer);
            navigate("/requests");
          }
        }, 1000);

        return () => clearInterval(timer);
      } else {
        modalMsg = "Error submitting form";
        onOpen();
      }
    } catch (error) {
      console.error("Error:", error);
      modalMsg = "Error submitting form " + error.message;
      onOpen();
    }
  };

  return (
    <div>
      {/* Form Container with Border, Padding, and Rounded Corners */}
      <div
        className="space-y-6 bg-white border border-gray-300 shadow-lg p-6"
        style={{ padding: "10px 20px", borderRadius: "10px" }}
      >
        {/* Form Title */}
        <div className="my-2">
          <h2 className="text-lg font-semibold text-gray-900">
            WFM Arrangement Form
          </h2>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Recurring Option */}
          <div className="my-2">
            <p style={{ marginTop: "24px" }}>Is this a recurring request?</p>
            <RadioGroup
              orientation="horizontal"
              defaultValue="No"
              className="space-x-4 mt-2"
              onValueChange={handleRecurringChange}
            >
              <Radio value="Yes">Yes</Radio>
              <Radio value="No">No</Radio>
            </RadioGroup>
          </div>

          {!isRecurring && (
            <>
              {/* Select WFM Date */}
              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Select WFM Date</p>
                <DatePicker
                  aria-label="Select WFM Date"
                  className="mt-2 w-full max-w-[284px]"
                  labelPlacement="outside"
                  variant="bordered"
                  showMonthAndYearPickers
                  // value={selectedDate}
                  minValue={today(getLocalTimeZone()).subtract({ months: 2 })}
                  maxValue={today(getLocalTimeZone()).add({ months: 3 })}
                  onChange={(date) => {
                    if (date && date.year && date.month && date.day) {
                      setSelectedDate(date);
                      addDateInput(date);
                    }
                  }}
                />
              </div>

              {/* Timeslot Selection */}
              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Timeslot</p>
                <Dropdown aria-label="Select Timeslot">
                  <DropdownTrigger>
                    <Button variant="bordered" className="mt-2">
                      {selectedTimeslot || "Choose a Timeslot"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    onAction={(key) => {
                      setSelectedTimeslot(key);
                      setFormData((prev) => ({ ...prev, timeslot: key }));
                    }}
                  >
                    <DropdownItem key="Full" description="9AM - 6PM">
                      Whole Day
                    </DropdownItem>
                    <DropdownItem key="AM" description="9AM - 1PM">
                      Morning
                    </DropdownItem>
                    <DropdownItem key="PM" description="2PM - 6PM">
                      Afternoon
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Requested Dates</p>
                <p style={{ fontSize: "0.875rem", color: "gray" }}>
                  Only Available Dates will be submitted
                </p>
                <Table
                  aria-label="Selected Dates with Availability"
                  className="mt-2"
                >
                  <TableHeader>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent={"No dates selected."}>
                    {inputDates.map((date, index) => (
                      <TableRow key={index}>
                        <TableCell>{date}</TableCell>
                        <TableCell>
                          <Chip
                            color={
                              statusColorMap[availability[date] || "Available"]
                            }
                            size="sm"
                            variant="flat"
                          >
                            {availability[date] || "Available"}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Conditionally render recurring date range and days of the week selection */}
          {isRecurring && (
            <>
              {/* For recurring dates */}
              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Select Date Range</p>
                <DateRangePicker
                  aria-label="Select Date Range"
                  visibleMonths={2}
                  variant="bordered"
                  className="mt-2"
                  value={{ start: startDate, end: endDate }}
                  minValue={today(getLocalTimeZone()).subtract({ months: 2 })}
                  maxValue={today(getLocalTimeZone()).add({ months: 3 })}
                  onChange={({ start, end }) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />
              </div>

              {/* Timeslot Selection */}
              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Timeslot</p>
                <Dropdown aria-label="Select Timeslot">
                  <DropdownTrigger>
                    <Button variant="bordered" className="mt-2">
                      {selectedTimeslot || "Choose a Timeslot"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu onAction={handleSelection}>
                    <DropdownItem key="FULL" description="9AM - 6PM">Whole Day</DropdownItem>
                    <DropdownItem key="AM" description="9AM - 1PM">Morning</DropdownItem>
                    <DropdownItem key="PM" description="2PM - 6PM">Afternoon</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Select which days of the week for recurring dates */}
              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Select Recurring Week Day</p>
                <Dropdown aria-label="Select Recurring Week Day">
                  <DropdownTrigger>
                    <Button variant="bordered" className="mt-2">
                      {SelectedDayOfTheWeek || "Choose the Day of the Week"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu onAction={handleSelectionDayOfTheWeek}>
                    <DropdownItem key="Monday">Monday</DropdownItem>
                    <DropdownItem key="Tuesday">Tuesday</DropdownItem>
                    <DropdownItem key="Wednesday">Wednesday</DropdownItem>
                    <DropdownItem key="Thursday">Thursday</DropdownItem>
                    <DropdownItem key="Friday">Friday</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Table to view extracted recurring dates with availability */}
              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Requested Dates</p>
                <p style={{ fontSize: "0.875rem", color: "gray" }}>
                  Only Available Dates will be submitted
                </p>
                <Table
                  aria-label="Extracted Recurring Dates with Availability"
                  className="mt-2"
                >
                  <TableHeader>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent={"No dates selected."}>
                    {extractedDates.map((date, index) => (
                      <TableRow key={index}>
                        <TableCell>{date}</TableCell>
                        <TableCell>
                          <Chip
                            color={statusColorMap[availability[date]]}
                            size="sm"
                            variant="flat"
                          >
                            {availability[date]}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Reason Input */}
          <div className="mt-4" style={{ marginTop: "24px" }}>
            <p>Reason</p>
            <Textarea
              key="Reason"
              variant="bordered"
              placeholder="Enter your reason"
              className="mt-2 w-full"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setFormData((prev) => ({ ...prev, reason: e.target.value }));
              }}
            />
          </div>

          {/* Submit Button */}
          <div className="mt-4 flex gap-2" style={{ marginTop: "24px" }}>
            <Button
              aria-label="Reset Form"
              color="default"
              onPress={() => {
                setInputDates([]);
                setSelectedTimeslot("Choose a Timeslot");
                setSelectedDayOfTheWeek("Choose a Week Day");
                setStartDate(null);
                setEndDate(null);
                setExtractedDates([]);
                setAvailability({});
              }}
            >
              Reset
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              aria-label="Submit Form"
            >
              Submit
            </Button>
          </div>
        </div>

        <Modal
          backdrop="opaque"
          isOpen={isOpen}
          onOpenChange={(isOpen) => {
            onOpenChange(isOpen);
            if (!isOpen && buttonColor === "success") {
              navigate("/requests"); // Navigate immediately if modal is closed after success
            }
          }}
          motionProps={{
            variants: {
              enter: {
                y: 0,
                opacity: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              },
              exit: {
                y: -20,
                opacity: 0,
                transition: {
                  duration: 0.2,
                  ease: "easeIn",
                },
              },
            },
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1" placement="top">
                  {modalTitle}
                </ModalHeader>
                <ModalBody>
                  <p>{modalMsg}</p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color={buttonColor}
                    variant="light"
                    onPress={() => {
                      onClose();
                      if (buttonColor === "success") {
                        navigate("/requests");
                      }
                    }}
                  >
                    Close {showCountdown && `(${countdown})`}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
