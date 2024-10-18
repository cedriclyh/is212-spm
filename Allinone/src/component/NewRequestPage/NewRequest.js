import React from "react";
import { DatePicker } from "@nextui-org/react";
import { Chip } from "@nextui-org/react";

const initialDates = ["20-10-2024"];

export default function NewRequest() {
  const [inputDates, setInputDates] = React.useState(initialDates);
  const [selectedDate, setSelectedDate] = React.useState(null);

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

  return (
    <div>
        <div>
            <h1>WFM Arrangement Form</h1>
        </div>

        {/* Form */}
        <div>

            {/* Select WFM Dates */}
            <div>
                <DatePicker
                    label={"Select WFM Dates"}
                    className="max-w-[284px]"
                    labelPlacement={"outside"}
                    variant="bordered"
                    showMonthAndYearPickers
                    value={selectedDate}
                    onChange={(date) => {
                    // Check that the date is valid before adding
                    if (date && date.year && date.month && date.day) {
                        setSelectedDate(date);
                        addDateInputs(date);
                    }
                    }}
                />
                {/* Display the chips for selected dates */}
                <div className="flex gap-2">
                    {inputDates.map((date, index) => (
                    <Chip key={index} onClose={() => handleClose(date)} variant="flat">
                        {date}
                    </Chip>
                    ))}
                </div>
            </div>

            {/*  */}

        </div>
    </div>
  );
}
