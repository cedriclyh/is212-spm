import React from "react";
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
  DateRangePicker
} from "@nextui-org/react";
import {getLocalTimeZone, parseDate, today} from "@internationalized/date";

const initialDates = ["20-10-2024"];

export default function NewRequest() {
  const [inputDates, setInputDates] = React.useState(initialDates);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [selectedTimeslot, setSelectedTimeslot] = React.useState("Choose a Timeslot");
  const [SelectedDayOfTheWeek, setSelectedDayOfTheWeek] = React.useState("Choose a Week Day");
  const [isRecurring, setIsRecurring] = React.useState(false); 

  // Function to format the date from the object returned by DatePicker
  const formatDateFromPicker = (dateObject) => {
    if (dateObject && dateObject.year && dateObject.month && dateObject.day) {
      const day = String(dateObject.day).padStart(2, '0');
      const month = String(dateObject.month).padStart(2, '0');
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
    const updatedDates = inputDates.filter(date => date !== inputDateToRemove);
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
  };

  return (
    <form className="space-y-12">
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
              <div className="mt-4" style={{ marginTop: "24px" }}> {/* mt-4 applied with inline style */}
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
                  />
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
            />
          </div>

          {/* Submit Button */}
          <div className="mt-4 flex gap-2"  style={{ marginTop: "24px" }}>
            <Button color="default">
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
