import React, { useEffect, useState } from "react";
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
  TableCell
} from "@nextui-org/react";
import { extractWeekdays, checkAvailability } from "./NewRequestUtils";
import { getLocalTimeZone, today } from "@internationalized/date";

const individualDates = [];

const statusColorMap = {
  Available: "success",
  Blocked: "danger"
};

export default function NewRequest() {
  const [inputDates, setInputDates] = useState(individualDates);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeslot, setSelectedTimeslot] = useState("Choose a Timeslot");
  const [SelectedDayOfTheWeek, setSelectedDayOfTheWeek] = useState("Choose a Week Day");
  const [isRecurring, setIsRecurring] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [extractedDates, setExtractedDates] = useState([]);
  const [availability, setAvailability] = useState({});
  const [reason, setReason] = useState('')

  const blockOutDates = React.useMemo(() => ["21-10-2024"], []);

  // Function to format the date from the object returned by DatePicker
  const formatDateFromPicker = (dateObject) => {
    if (dateObject && dateObject.year && dateObject.month && dateObject.day) {
      const day = String(dateObject.day).padStart(2, "0");
      const month = String(dateObject.month).padStart(2, "0");
      const year = dateObject.year;
      return `${day}-${month}-${year}`;
    }
    return null;
  };

  const addDateInputs = (inputDateToAdd) => {
    const formattedDate = formatDateFromPicker(inputDateToAdd);

    // Only add if it's a valid date and not already in the list
    if (formattedDate && !inputDates.includes(formattedDate)) {
      setInputDates([...inputDates, formattedDate]);
      setSelectedDate(null); // Clear DatePicker after selection
    }
  };

  const handleClose = (inputDateToRemove) => {
    const updatedDates = inputDates.filter((date) => date !== inputDateToRemove);
    setInputDates(updatedDates);
  };

  const handleSelection = (key) => {
    setSelectedTimeslot(key); // Update the selected timeslot value
  };

  const handleSelectionDayOfTheWeek = (key) => {
    setSelectedDayOfTheWeek(key); // Update week day value
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
    setReason('');
  };

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
      const formattedStartDate = formatDateFromPicker(startDate);
      const formattedEndDate = formatDateFromPicker(endDate);
      const dates = extractWeekdays(formattedStartDate, formattedEndDate, SelectedDayOfTheWeek);
      setExtractedDates(dates); 
    }
  }, [startDate, endDate, SelectedDayOfTheWeek, isRecurring]);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    
  }

  return (
    <form className="space-y-12" onSubmit={handleSubmit}>
      {/* Form Container with Border, Padding, and Rounded Corners */}
      <div className="space-y-6 bg-white border border-gray-300 shadow-lg p-6" style={{ padding: "10px 20px", borderRadius: "10px" }}>
        {/* Form Title */}
        <div className="my-2">
          <h2 className="text-lg font-semibold text-gray-900">WFM Arrangement Form</h2>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          
          {/* Recurring Option */}
          <div className="my-2">
            <p style={{ marginTop: "24px" }}>Is this a recurring request?</p>
            <RadioGroup 
              orientation="horizontal" 
              defaultValue="No" 
              isRequired={true}
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
                  className="mt-2 w-full max-w-[284px]"
                  labelPlacement="outside"
                  variant="bordered"
                  showMonthAndYearPickers
                  value={selectedDate}
                  minValue={today(getLocalTimeZone()).subtract({months: 2})}
                  maxValue={today(getLocalTimeZone()).add({months: 3})}
                  isRequired={true}
                  onChange={(date) => {
                    if (date && date.year && date.month && date.day) {
                      setSelectedDate(date);
                      addDateInputs(date);
                    }
                  }}
                />
                <div className="flex gap-2 mt-2">
                  {inputDates.map((date, index) => (
                    <Chip key={index} onClose={() => handleClose(date)} variant="flat">
                      {date}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Timeslot Selection */}
              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Timeslot</p>
                <Dropdown isRequired={true}>
                  <DropdownTrigger>
                    <Button variant="bordered" className="mt-2">
                      {selectedTimeslot || "Choose a Timeslot"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu onAction={handleSelection}>
                    <DropdownItem key="Whole Day" description="9AM - 6PM">Whole Day</DropdownItem>
                    <DropdownItem key="Morning" description="9AM - 1PM">Morning</DropdownItem>
                    <DropdownItem key="Afternoon" description="2PM - 6PM">Afternoon</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Requested Dates</p>
                <p style={{ fontSize: "0.875rem", color: "gray" }}>Only Available Dates will be submitted</p>
                <Table aria-label="Selected Dates with Availability" className="mt-2">
                  <TableHeader>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent={"No dates selected."}>
                    {inputDates.map((date, index) => (
                      <TableRow key={index}>
                        <TableCell>{date}</TableCell>
                        <TableCell>
                          <Chip color={statusColorMap[availability[date] || "Available"]} size="sm" variant="flat">
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
                    visibleMonths={2}
                    variant="bordered"
                    className="mt-2"
                    isRequired={true}
                    minValue={today(getLocalTimeZone()).subtract({months: 2})}
                    maxValue={today(getLocalTimeZone()).add({months: 3})}
                    onChange={({ start, end }) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
              </div>

              {/* Timeslot Selection */}
              <div className="mt-4" style={{ marginTop: "24px" }}>
                <p>Timeslot</p>
                <Dropdown isRequired={true}>
                  <DropdownTrigger>
                    <Button variant="bordered" className="mt-2">
                      {selectedTimeslot || "Choose a Timeslot"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu onAction={handleSelection}>
                    <DropdownItem key="Whole Day" description="9AM - 6PM">Whole Day</DropdownItem>
                    <DropdownItem key="Morning" description="9AM - 1PM">Morning</DropdownItem>
                    <DropdownItem key="Afternoon" description="2PM - 6PM">Afternoon</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Select which days of the week for recurring dates */}
              <div className="mt-4" style={{ marginTop: "24px" }}>
                  <p>Select Recurring Week Day</p>
                  <Dropdown isRequired={true}> 
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
                <p style={{ fontSize: "0.875rem", color: "gray" }}>Only Available Dates will be submitted</p>
                <Table aria-label="Extracted Recurring Dates with Availability" className="mt-2">
                  <TableHeader>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent={"No dates selected."}>
                    {extractedDates.map((date, index) => (
                      <TableRow key={index}>
                        <TableCell>{date}</TableCell>
                        <TableCell>
                          <Chip color={statusColorMap[availability[date]]} size="sm" variant="flat">
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
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <div className="mt-4 flex gap-2"  style={{ marginTop: "24px" }}>
            <Button
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
            <Button color="primary">
              Submit
            </Button>  
          </div>

        </div>
      </div>
    </form>
  );
}
